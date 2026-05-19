import { v4 as uuid } from "uuid";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { TestRepository } from "../repositories/testRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { generateCode } from "../utils/inviteCode.js";

const testRepo = new TestRepository();

// Basic scoring: count correct answers (if provided) - placeholder
function scoreAnswers(test, answers) {
    // For now, no scoring (return null). Future: compare with question.answer
    return null;
}

export class TestGenerationService {
    async generateFromText({
        sourceText,
        topic,
        filename,
        title,
        questionCount,
        difficulty,
        timeLimitSeconds,
        expiresInMinutes,
        extraInstructions,
        params,
        createdBy,
    }) {
        // In test environment always force dry-run unless explicitly disabled to avoid slow network calls.
        if (
            process.env.NODE_ENV === "test" &&
            process.env.DRY_RUN_AI !== "false"
        ) {
            process.env.DRY_RUN_AI = "true";
        }
        const expires_at = new Date(
            Date.now() + expiresInMinutes * 60000,
        ).toISOString();
        const code = generateCode();
        const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

        const prompt = this._buildPrompt({
            sourceText: sourceText || null,
            topic: topic || null,
            title,
            questionCount,
            difficulty,
            extraInstructions,
        });
        const generationParams = {
            questionCount,
            difficulty,
            timeLimitSeconds,
            expiresInMinutes,
            ...params,
        };

        let questions;
        if (process.env.DRY_RUN_AI === "true") {
            questions = this._fakeQuestions(questionCount);
        } else {
            questions = await this._callOpenRouterJSON({
                model,
                prompt,
                questionCount,
            });
        }

        // Post-processing: ensure exact count, synthesize explanations/references
        if (Array.isArray(questions)) {
            // Trim or pad
            if (questions.length > questionCount) {
                questions = questions.slice(0, questionCount);
            } else if (questions.length < questionCount) {
                // Simple duplication with new ids marked as variant if model under-produced
                const needed = questionCount - questions.length;
                for (let i = 0; i < needed; i++) {
                    const base = questions[i % questions.length];
                    questions.push({
                        ...base,
                        id: uuid(),
                        question: base.question + " (Variant)",
                    });
                }
            }
            // Guarantee explanation & reference fields
            questions = questions.map((q) => {
                let explanation = q.explanation?.trim();
                if (!explanation) {
                    explanation = this._synthesizeExplanation(q, sourceText);
                }
                let reference = q.reference?.trim();
                if (!reference) {
                    reference = this._extractReferenceSnippet(q, sourceText);
                }
                return { ...q, explanation, reference };
            });
        }

        const test = await testRepo.create({
            id: uuid(),
            code,
            title:
                title ||
                (topic ? `Test: ${topic.slice(0, 80)}` : "Generated Test"),
            source_filename: filename || null,
            source_text: (sourceText || topic || "").slice(0, 20000),
            model,
            params_json: generationParams,
            questions_json: questions,
            expires_at,
            time_limit_seconds: timeLimitSeconds,
            created_by: createdBy || null,
        });
        return test;
    }

    async _callOpenRouterJSON({ model, prompt, questionCount }) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey)
            throw ApiError.internal(
                "Missing OPENROUTER_API_KEY",
                "MISSING_API_KEY",
            );
        const wantSchema = process.env.AI_SCHEMA_JSON !== "false";
        const schema = {
            type: "object",
            properties: {
                questions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            type: {
                                type: "string",
                                description:
                                    "question type: mcq|short|truefalse",
                            },
                            question: { type: "string" },
                            options: {
                                type: "array",
                                items: { type: "string" },
                            },
                            answer: { type: "string" },
                            explanation: {
                                type: "string",
                                description:
                                    "Conceptual reasoning why the answer is correct, 40-400 chars",
                            },
                            reference: {
                                type: "string",
                                description:
                                    "Short quote from source material supporting the answer, or null",
                            },
                            difficulty: { type: "string" },
                            conceptTags: {
                                type: "array",
                                items: { type: "string" },
                                description:
                                    "1-3 specific concepts tested by this question",
                            },
                        },
                        required: [
                            "id",
                            "type",
                            "question",
                            "answer",
                            "options",
                            "explanation",
                            "conceptTags",
                        ],
                        additionalProperties: true,
                    },
                    minItems: 1,
                },
            },
            required: ["questions"],
            additionalProperties: false,
        };

        const baseMessages = [
            {
                role: "system",
                content:
                    'You are an expert educational quiz generator. Output ONLY valid JSON with a "questions" array. No prose, no markdown, no explanations outside the JSON. Match the language of the source material or topic exactly.',
            },
            {
                role: "user",
                content: `${prompt}\n\nOutput strictly the JSON object with a questions array. Every question must have: id, type, question, options, answer, explanation, conceptTags.`,
            },
        ];

        const bodyWithSchemaStrict = {
            model,
            messages: baseMessages,
            response_format: {
                type: "json_schema",
                json_schema: { name: "quiz", strict: true, schema },
            },
        };
        const bodyWithSchema = {
            model,
            messages: baseMessages,
            response_format: {
                type: "json_schema",
                json_schema: { name: "quiz", schema },
            },
        };
        const bodyNoSchema = {
            model,
            messages: baseMessages,
            temperature: 0.2,
        };

        const headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        };
        if (process.env.OPENROUTER_SITE_URL)
            headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
        if (process.env.OPENROUTER_SITE_TITLE)
            headers["X-Title"] = process.env.OPENROUTER_SITE_TITLE;

        async function doRequest(body, label) {
            const res = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                { method: "POST", headers, body: JSON.stringify(body) },
            );
            const text = await res.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch {
                json = null;
            }
            return { ok: res.ok, status: res.status, text, json, label };
        }

        const attempts = [];
        if (wantSchema) {
            attempts.push(["schema-strict", bodyWithSchemaStrict]);
            attempts.push(["schema", bodyWithSchema]);
        }
        attempts.push(["fallback", bodyNoSchema]);

        let lastErr;
        for (const [label, body] of attempts) {
            const resp = await doRequest(body, label);
            if (!resp.ok) {
                if (
                    (label === "schema-strict" || label === "schema") &&
                    resp.status === 400 &&
                    /response_format/i.test(resp.text)
                ) {
                    logger.warn(
                        { status: resp.status, label },
                        "Schema format unsupported by model, trying next format",
                    );
                    lastErr = new Error("Schema format unsupported");
                    continue;
                }
                logger.error(
                    {
                        status: resp.status,
                        raw: resp.text.slice(0, 500),
                        label,
                    },
                    "OpenRouter error",
                );
                lastErr = new Error(`AI generation failed (${label})`);
                continue;
            }
            try {
                const content = resp.json?.choices?.[0]?.message?.content;
                const parsed = this._robustParseJSON(content);
                if (!Array.isArray(parsed.questions))
                    throw ApiError.internal(
                        "Missing questions[]",
                        "AI_MALFORMED_RESPONSE",
                    );
                // Do not enforce count here; post-processing will handle exact count and padding
                return parsed.questions.map((q) => ({
                    ...q,
                    id: q.id || uuid(),
                }));
            } catch (e) {
                logger.error(
                    {
                        label,
                        parseError: e.message,
                        contentSnippet: (
                            resp.json?.choices?.[0]?.message?.content || ""
                        ).slice(0, 200),
                    },
                    "Parse failed",
                );
                lastErr = new Error(`Invalid AI JSON (${label}): ${e.message}`);
                continue;
            }
        }
        throw (
            lastErr ||
            ApiError.internal("AI generation failed", "AI_GENERATION_FAILED")
        );
    }

    _robustParseJSON(raw) {
        if (!raw || typeof raw !== "string")
            throw ApiError.internal("Empty content", "AI_EMPTY_CONTENT");
        let cleaned = raw.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned
                .replace(/^```[a-zA-Z0-9]*\n/, "")
                .replace(/```$/, "")
                .trim();
        }
        const firstBrace = cleaned.indexOf("{");
        if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);
        try {
            return JSON.parse(cleaned);
        } catch {}
        // attempt brace matching
        let depth = 0;
        let end = -1;
        for (let i = 0; i < cleaned.length; i++) {
            const ch = cleaned[i];
            if (ch === "{") depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0) {
                    end = i + 1;
                    break;
                }
            }
        }
        if (end !== -1) {
            const candidate = cleaned.slice(0, end);
            try {
                return JSON.parse(candidate);
            } catch {}
        }
        throw ApiError.internal(
            "Unable to parse JSON content",
            "AI_PARSE_FAILURE",
        );
    }

    _fakeQuestions(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: uuid(),
            type: "mcq",
            question: `Sample question ${i + 1}?`,
            options: ["A", "B", "C", "D"],
            answer: "A",
            difficulty: "easy",
            explanation:
                "Because option A is the illustrative correct answer in dry-run mode.",
            reference: null,
        }));
    }

    _buildPrompt({
        sourceText,
        topic,
        title,
        questionCount,
        difficulty,
        extraInstructions,
    }) {
        const langHint = this._detectLanguageHint(sourceText || topic || "");

        // Topic-only mode: generate from topic without source material
        if (!sourceText && topic) {
            return [
                `You are an expert educational quiz generator.`,
                `Produce EXACTLY ${questionCount} questions (no more, no fewer) at ${difficulty} difficulty about the topic: "${topic}".`,
                langHint
                    ? `CRITICAL: Generate ALL questions, ALL answer options, and ALL explanations in ${langHint}. The topic name is in ${langHint} — match that language exactly.`
                    : "",
                ``,
                `Requirements:`,
                `- Mix question types: prefer multiple-choice (type "mcq", 4 distinct plausible options), but include some true/false (type "truefalse") and short-answer (type "short").`,
                `- Each question MUST include: id (string), type ("mcq"|"truefalse"|"short"), question (string), options (array of strings, empty for non-MCQ), answer (string — the correct answer text), explanation (40-400 chars, conceptual reasoning why the answer is correct), reference (short snippet or null).`,
                `- Each question MUST include conceptTags: an array of 1-3 specific concepts tested by this question (e.g. "Київська Русь", "Козацтво", "Photosynthesis"). Be specific, not broad.`,
                `- Cover different aspects of the topic, from fundamentals to applied knowledge.`,
                `- Explanations must give conceptual reasoning, not just restate the answer.`,
                `- For true/false: do NOT reveal the answer in the explanation.`,
                `- All explanations must be unique and specific to each question.`,
                `- Output ONLY valid JSON: { "questions": [ { ... } ] }`,
                ``,
                `Title: ${title}`,
                extraInstructions
                    ? `Extra Instructions: ${extraInstructions}`
                    : "",
            ]
                .filter(Boolean)
                .join("\n");
        }

        // Source text mode: generate from provided material
        return [
            `You are an expert educational quiz generator.`,
            `Produce EXACTLY ${questionCount} questions (no more, no fewer) at ${difficulty} difficulty.`,
            `CRITICAL: Generate questions ONLY from the provided source material below. Do NOT use outside knowledge. Every question must be answerable from the material.`,
            langHint
                ? `CRITICAL: The source material is in ${langHint}. Generate ALL questions, ALL answer options, and ALL explanations in ${langHint}. Match the language of the source material exactly.`
                : "",
            topic
                ? `Focus area: "${topic}" — prioritize content related to this topic within the material.`
                : "",
            ``,
            `Requirements:`,
            `- Mix question types: prefer multiple-choice (type "mcq", 4 distinct plausible options), but include some true/false (type "truefalse") and short-answer (type "short").`,
            `- Each question MUST include: id (string), type ("mcq"|"truefalse"|"short"), question (string), options (array of strings, empty for non-MCQ), answer (string — the correct answer text), explanation (40-400 chars, conceptual reasoning why the answer is correct), reference (exact quote from the source material that supports the answer, 20-150 chars).`,
            `- Each question MUST include conceptTags: an array of 1-3 specific concepts tested by this question. Extract concept names from the material (e.g. "Київська Русь", "Козацтво", "Трипільська культура"). Be specific.`,
            `- Cover different sections and key facts from the material.`,
            `- Explanations must give conceptual reasoning, not just restate the answer.`,
            `- For true/false: do NOT reveal the answer in the explanation.`,
            `- All explanations must be unique and specific to each question.`,
            `- Output ONLY valid JSON: { "questions": [ { ... } ] }`,
            ``,
            `Title: ${title}`,
            ``,
            `=== SOURCE MATERIAL START ===`,
            sourceText,
            `=== SOURCE MATERIAL END ===`,
            extraInstructions ? `Extra Instructions: ${extraInstructions}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    }

    /** Simple language detection heuristic based on Unicode script ranges */
    _detectLanguageHint(text) {
        if (!text) return null;
        const sample = text.slice(0, 500);
        // Count character types
        const cyrillic = (sample.match(/[\u0400-\u04FF]/g) || []).length;
        const latin = (sample.match(/[A-Za-z]/g) || []).length;
        const cjk = (
            sample.match(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) || []
        ).length;
        const arabic = (sample.match(/[\u0600-\u06FF]/g) || []).length;

        if (cjk > 10) return "the same language as the source (CJK)";
        if (arabic > 10) return "Arabic";
        if (cyrillic > latin) {
            // Distinguish Ukrainian vs Russian by specific Ukrainian letters
            const ukrainian = (sample.match(/[іїєґІЇЄҐ]/g) || []).length;
            return ukrainian > 2
                ? "Ukrainian (українською мовою)"
                : "the same Cyrillic language as the source material";
        }
        if (latin > 20) return null; // English is default, no special instruction needed
        return null;
    }

    _synthesizeExplanation(question, sourceText) {
        const base =
            "The correct answer follows from the key concept in the provided material.";
        // Attempt naive keyword extraction from question
        const words = question.question
            .split(/[^A-Za-z0-9]+/)
            .filter((w) => w.length > 4)
            .slice(0, 5);
        if (!sourceText) return base;
        for (const w of words) {
            const idx = sourceText.toLowerCase().indexOf(w.toLowerCase());
            if (idx !== -1) {
                return `This is correct because the material highlights '${w}' as central to understanding this concept.`;
            }
        }
        return base;
    }

    _extractReferenceSnippet(question, sourceText) {
        if (!sourceText) return null;
        const key = question.question
            .split(/[^A-Za-z0-9]+/)
            .filter((w) => w.length > 5)[0];
        if (!key) return null;
        const lower = sourceText.toLowerCase();
        const idx = lower.indexOf(key.toLowerCase());
        if (idx === -1) return null;
        const start = Math.max(0, idx - 40);
        const end = Math.min(sourceText.length, idx + 60);
        return sourceText.slice(start, end).replace(/\s+/g, " ").trim();
    }
}

export function computeScore(test, answers) {
    return scoreAnswers(test, answers);
}
