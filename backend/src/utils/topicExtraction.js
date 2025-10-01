// Simple keyword frequency extraction for recommendations.
// Not NLP-heavy: strips short/common words and counts remaining tokens.
const STOP = new Set([
  'the','and','for','with','that','this','from','your','about','which','into','their','there','have','will','would','could','should','were','been','being','after','before','when','what','where','why','how','does','did','doing','over','under','while','such','only','than','then','them','they','these','those','also','because','among','using','based'
]);

export function extractTopicsFromWrongAnswers(answerRows, { maxTopics = 10 } = {}) {
  const freq = new Map();
  for (const a of answerRows) {
    const text = (a.question_text || '').toLowerCase();
    const words = text.split(/[^a-z0-9]+/).filter(w => w.length > 4 && !STOP.has(w));
    const used = new Set();
    for (const w of words) {
      if (used.has(w)) continue; // avoid double counting same word in one question
      used.add(w);
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  const topics = Array.from(freq.entries())
    .sort((a,b)=> b[1]-a[1])
    .slice(0, maxTopics)
    .map(([topic, count]) => ({ topic, count }));
  return topics;
}

export function synthesizeRecommendationBlocks(topics) {
  return topics.map(t => ({
    topic: t.topic,
    wrongCount: t.count,
    suggestedQuestionCount: Math.min(6, Math.max(2, t.count)),
    priority: t.count
  }));
}
