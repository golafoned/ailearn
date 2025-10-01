import { TestGenerationService } from "../services/testGenerationService.js";
import { TestRepository } from "../repositories/testRepository.js";
import { TestAttemptRepository } from "../repositories/testAttemptRepository.js";
import { AttemptAnswersRepository } from "../repositories/testAttemptRepository.js";
import { v4 as uuid } from "uuid";
import { computeScore } from "../services/testGenerationService.js";

const genService = new TestGenerationService();
const testRepo = new TestRepository();
const attemptRepo = new TestAttemptRepository();
const attemptAnswersRepo = new AttemptAnswersRepository();

export async function generateTest(req, res, next) {
    try {
        const {
            title,
            questionCount,
            difficulty,
            timeLimitSeconds,
            expiresInMinutes,
            extraInstructions,
            sourceText,
            filename,
            params,
        } = req.body;
        const test = await genService.generateFromText({
            sourceText,
            filename,
            title,
            questionCount,
            difficulty,
            timeLimitSeconds,
            expiresInMinutes,
            extraInstructions,
            params,
            createdBy: req.user.id,
        });
        res.status(201).json({
            id: test.id,
            code: test.code,
            expiresAt: test.expires_at,
            timeLimitSeconds: test.time_limit_seconds,
        });
    } catch (e) {
        next(e);
    }
}

export async function getTestByCode(req, res, next) {
    try {
        const code = req.params.code.toUpperCase();
        const test = await testRepo.findByCode(code);
        if (!test) return res.status(404).json({ error: "Test not found" });
        // Only expose metadata & question shells (no answers)
        const questions = JSON.parse(test.questions_json).map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options || [],
        }));
        res.json({
            code: test.code,
            title: test.title,
            expiresAt: test.expires_at,
            timeLimitSeconds: test.time_limit_seconds,
            questions,
        });
    } catch (e) {
        next(e);
    }
}

export async function startAttempt(req, res, next) {
    try {
        const { code, participantName, displayName } = req.body;
        const test = await testRepo.findByCode(code.toUpperCase());
        if (!test) return res.status(404).json({ error: "Test not found" });
        if (new Date(test.expires_at) < new Date())
            return res.status(410).json({ error: "Test expired" });
        // If auth, force participant name to stored display name (fallback to email prefix) ignoring provided participantName
        let finalParticipantName = participantName;
        let finalDisplayName = displayName || null;
        if (req.user) {
            finalParticipantName = req.user.display_name || req.user.email.split('@')[0];
            finalDisplayName = req.user.display_name || finalDisplayName;
        }
        const attempt = await attemptRepo.create({
            id: uuid(),
            test_id: test.id,
            user_id: req.user?.id || null,
            participant_name: finalParticipantName,
            display_name: finalDisplayName,
        });
        res.status(201).json({
            attemptId: attempt.id,
            code: test.code,
            startedAt: attempt.started_at,
        });
    } catch (e) {
        next(e);
    }
}

export async function submitAttempt(req, res, next) {
    try {
        const { attemptId, answers } = req.body;
        const attempt = await attemptRepo.findById(attemptId);
        if (!attempt)
            return res.status(404).json({ error: "Attempt not found" });
        if (attempt.submitted_at)
            return res.status(400).json({ error: "Already submitted" });
        if (attempt.user_id && req.user && attempt.user_id !== req.user.id)
            return res.status(403).json({ error: 'Forbidden' });
        const test = await testRepo.findById(attempt.test_id);
        const questions = JSON.parse(test.questions_json);
        // Build detailed answer records
        const answerRecords = answers.map((a) => {
            const q = questions.find((q) => q.id === a.questionId) || {};
            const isCorrect =
                q.answer != null && a.answer != null
                    ? String(q.answer).trim().toLowerCase() ===
                      String(a.answer).trim().toLowerCase()
                    : null;
            return {
                id: crypto.randomUUID(),
                question_id: a.questionId,
                question_text: q.question || "",
                correct_answer: q.answer || null,
                user_answer: a.answer || null,
                is_correct: isCorrect === null ? 0 : isCorrect ? 1 : 0,
            };
        });
        const numericScoreParts = answerRecords.filter(
            (r) => r.correct_answer != null && r.user_answer != null
        );
        const correctCount = numericScoreParts.filter(
            (r) => r.is_correct === 1
        ).length;
        const score = numericScoreParts.length
            ? Math.round((correctCount / numericScoreParts.length) * 100)
            : null;
        await attemptRepo.submit(attemptId, answers, score);
        await attemptAnswersRepo.bulkInsert(attemptId, answerRecords);
        const updated = await attemptRepo.findById(attemptId);
        res.json({
            attemptId: updated.id,
            submittedAt: updated.submitted_at,
            score: updated.score,
            totalQuestions: questions.length,
            answered: answers.length,
        });
    } catch (e) {
        next(e);
    }
}

export async function listTestAttempts(req, res, next) {
    try {
        const testId = req.params.testId;
        const test = await testRepo.findById(testId);
        if (!test) return res.status(404).json({ error: "Test not found" });
        if (test.created_by && test.created_by !== req.user?.id)
            return res.status(403).json({ error: "Forbidden" });
        const attempts = await attemptRepo.listByTest(testId);
        res.json({
            attempts: attempts.map((a) => ({
                id: a.id,
                userId: a.user_id,
                participantName: a.participant_name,
                displayName: a.display_name,
                startedAt: a.started_at,
                submittedAt: a.submitted_at,
                score: a.score,
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function listMyAttempts(req, res, next) {
    try {
        const attempts = await attemptRepo.listByUser(req.user.id);
        res.json({ attempts });
    } catch (e) {
        next(e);
    }
}

export async function listMyTests(req, res, next) {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        const p = Math.max(1, parseInt(page));
        const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
        const { items, total } = await testRepo.listByOwnerPaged(req.user.id, { page: p, pageSize: ps });
        const summaries = items.map(t => ({ id: t.id, code: t.code, title: t.title, createdAt: t.created_at, expiresAt: t.expires_at }));
        res.json({ items: summaries, page: p, pageSize: ps, total, totalPages: Math.ceil(total/ps) });
    } catch (e) { next(e); }
}
