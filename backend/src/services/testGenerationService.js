import { v4 as uuid } from 'uuid';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { TestRepository } from '../repositories/testRepository.js';
import { generateCode } from '../utils/inviteCode.js';

const testRepo = new TestRepository();

// Basic scoring: count correct answers (if provided) - placeholder
function scoreAnswers(test, answers) {
  // For now, no scoring (return null). Future: compare with question.answer
  return null;
}

export class TestGenerationService {
  async generateFromText({ sourceText, filename, title, questionCount, difficulty, timeLimitSeconds, expiresInMinutes, extraInstructions, params }) {
    const expires_at = new Date(Date.now() + expiresInMinutes * 60000).toISOString();
    const code = generateCode();
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const prompt = this._buildPrompt({ sourceText, title, questionCount, difficulty, extraInstructions });
    const generationParams = { questionCount, difficulty, timeLimitSeconds, expiresInMinutes, ...params };

    let questions;
    if (process.env.DRY_RUN_AI === 'true') {
      questions = this._fakeQuestions(questionCount);
    } else {
      questions = await this._callOpenRouterJSON({ model, prompt, questionCount });
    }

    const test = await testRepo.create({
      id: uuid(),
      code,
      title: title || 'Generated Test',
      source_filename: filename || null,
      source_text: sourceText.slice(0, 20000),
  model,
      params_json: generationParams,
      questions_json: questions,
      expires_at,
      time_limit_seconds: timeLimitSeconds
    });
    return test;
  }

  async _callOpenRouterJSON({ model, prompt, questionCount }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
    const wantSchema = process.env.AI_SCHEMA_JSON !== 'false';
    const schema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', description: 'question type: mcq|short|truefalse' },
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              answer: { type: 'string' },
              difficulty: { type: 'string' }
            },
            required: ['id','type','question'],
            additionalProperties: true
          },
          minItems: 1
        }
      },
      required: ['questions'],
      additionalProperties: false
    };

    const baseMessages = [
      { role: 'system', content: 'You output ONLY JSON. No prose. No explanations.' },
      { role: 'user', content: `${prompt}\nOutput strictly the JSON object with a questions array.` }
    ];

    const bodyWithSchema = {
      model,
      messages: baseMessages,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'quiz', strict: true, schema }
      }
    };
    const bodyNoSchema = { model, messages: baseMessages, temperature: 0.2 };

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    if (process.env.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
    if (process.env.OPENROUTER_SITE_TITLE) headers['X-Title'] = process.env.OPENROUTER_SITE_TITLE;

    async function doRequest(body, label) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers, body: JSON.stringify(body) });
      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { json = null; }
      return { ok: res.ok, status: res.status, text, json, label };
    }

    const attempts = [];
    if (wantSchema) attempts.push(['schema', bodyWithSchema]);
    attempts.push(['fallback', bodyNoSchema]);

    let lastErr;
    for (const [label, body] of attempts) {
      const resp = await doRequest(body, label);
      if (!resp.ok) {
        if (label === 'schema' && resp.status === 400 && /response_format/i.test(resp.text)) {
          logger.warn({ status: resp.status }, 'Schema unsupported by model, retrying without schema');
          lastErr = new Error('Schema unsupported');
          continue;
        }
        logger.error({ status: resp.status, raw: resp.text.slice(0,500), label }, 'OpenRouter error');
        lastErr = new Error(`AI generation failed (${label})`);
        continue;
      }
      try {
        const content = resp.json?.choices?.[0]?.message?.content;
        const parsed = this._robustParseJSON(content);
        if (!Array.isArray(parsed.questions)) throw new Error('Missing questions[]');
        if (questionCount && parsed.questions.length > questionCount) parsed.questions = parsed.questions.slice(0, questionCount);
        return parsed.questions.map(q => ({ ...q, id: q.id || uuid() }));
      } catch (e) {
        logger.error({ label, parseError: e.message, contentSnippet: (resp.json?.choices?.[0]?.message?.content || '').slice(0,200) }, 'Parse failed');
        lastErr = new Error(`Invalid AI JSON (${label}): ${e.message}`);
        continue;
      }
    }
    throw lastErr || new Error('AI generation failed');
  }

  _robustParseJSON(raw) {
    if (!raw || typeof raw !== 'string') throw new Error('Empty content');
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/```$/,'').trim();
    }
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);
    try { return JSON.parse(cleaned); } catch {}
    // attempt brace matching
    let depth = 0; let end = -1;
    for (let i=0;i<cleaned.length;i++) {
      const ch = cleaned[i];
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i+1; break; } }
    }
    if (end !== -1) {
      const candidate = cleaned.slice(0,end);
      try { return JSON.parse(candidate); } catch {}
    }
    throw new Error('Unable to parse JSON content');
  }

  _fakeQuestions(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: uuid(),
      type: 'mcq',
      question: `Sample question ${i+1}?`,
      options: ['A','B','C','D'],
      answer: 'A',
      difficulty: 'easy'
    }));
  }

  _buildPrompt({ sourceText, title, questionCount, difficulty, extraInstructions }) {
    return `Generate ${questionCount} quiz questions at ${difficulty} difficulty based ONLY on the following material. Provide multiple choice when suitable with 4 options labeled A-D.\nTitle: ${title}\nMaterial:\n${sourceText}\nExtra: ${extraInstructions || 'None'}\nReturn JSON per schema.`;
  }
}

export function computeScore(test, answers) {
  return scoreAnswers(test, answers);
}
