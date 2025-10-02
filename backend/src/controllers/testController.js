import { TestGenerationService } from "../services/testGenerationService.js";
import { TestRepository } from "../repositories/testRepository.js";
import { TestAttemptRepository } from "../repositories/testAttemptRepository.js";
import { AttemptAnswersRepository } from "../repositories/testAttemptRepository.js";
import { v4 as uuid } from "uuid";
import { computeScore } from "../services/testGenerationService.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import {
    extractTopicsFromWrongAnswers,
    synthesizeRecommendationBlocks,
} from "../utils/topicExtraction.js";

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
        if (!test) throw ApiError.notFound("Test not found", "TEST_NOT_FOUND");
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
        if (!test) throw ApiError.notFound("Test not found", "TEST_NOT_FOUND");
        // If review test ensure only owner can start
        if (
            test.is_review &&
            test.created_by &&
            test.created_by !== req.user?.id
        ) {
            throw ApiError.forbidden("Forbidden", "FORBIDDEN_REVIEW_START");
        }
        if (new Date(test.expires_at) < new Date())
            throw ApiError.gone("Test expired", "TEST_EXPIRED");
        // Defensive: if auth header present but optionalAuth did not populate user (edge timing), decode here
        if (!req.user && req.headers.authorization?.startsWith("Bearer ")) {
            const tok = req.headers.authorization.slice(7);
            try {
                const payload = jwt.verify(tok, env.jwt.accessSecret);
                // minimal user context
                req.user = { id: payload.sub, email: payload.email };
            } catch (e) {
                // ignore
            }
        }
        // If auth, force participant name to stored display name (fallback to email prefix) ignoring provided participantName
        let finalParticipantName = participantName;
        let finalDisplayName = displayName || null;
        if (req.user) {
            // Authenticated: enforce participant name = stored display name (or email prefix)
            finalParticipantName =
                req.user.display_name || req.user.email.split("@")[0];
            if (!finalDisplayName)
                finalDisplayName = req.user.display_name || null;
        }
        const attempt = await attemptRepo.create({
            id: uuid(),
            test_id: test.id,
            user_id: req.user?.id || null,
            participant_name: finalParticipantName,
            display_name: finalDisplayName,
        });
        // Safety: if authenticated and stored participant_name differs from enforced name, patch it
        if (req.user && attempt.participant_name !== finalParticipantName) {
            // minimal inline update to keep repository simple
            const dbMod = await import("../db/index.js");
            const dbInstance = await dbMod.getDb();
            const safeName = finalParticipantName.replace(/'/g, "''");
            dbInstance.exec(
                `UPDATE test_attempts SET participant_name='${safeName}' WHERE id='${attempt.id}';`
            );
            if (!attempt.user_id) {
                dbInstance.exec(
                    `UPDATE test_attempts SET user_id='${req.user.id}' WHERE id='${attempt.id}';`
                );
            }
        }
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
            throw ApiError.notFound("Attempt not found", "ATTEMPT_NOT_FOUND");
        if (attempt.submitted_at)
            throw ApiError.badRequest("ALREADY_SUBMITTED", "Already submitted");
        // Ownership enforcement: if attempt is linked to a user, require valid auth for that user
        if (attempt.user_id) {
            const authHeader = req.headers.authorization || "";
            if (!authHeader.startsWith("Bearer "))
                throw ApiError.unauthorized("Auth required", "AUTH_REQUIRED");
            try {
                const token = authHeader.slice(7);
                const decoded = jwt.verify(token, env.jwt.accessSecret);
                if (decoded.sub !== attempt.user_id)
                    throw ApiError.forbidden(
                        "Forbidden",
                        "FORBIDDEN_ATTEMPT_SUBMIT"
                    );
            } catch (e) {
                throw ApiError.unauthorized("Invalid token", "INVALID_TOKEN");
            }
        }
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
        if (!test) throw ApiError.notFound("Test not found", "TEST_NOT_FOUND");
        if (test.created_by && test.created_by !== req.user?.id)
            throw ApiError.forbidden(
                "Forbidden",
                "FORBIDDEN_TEST_ATTEMPTS_LIST"
            );
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
        res.json({
            attempts: attempts.map((a) => ({
                id: a.id,
                testId: a.test_id,
                testCode: a.test_code,
                testTitle: a.test_title,
                startedAt: a.started_at,
                submittedAt: a.submitted_at,
                score: a.score,
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function listMyTests(req, res, next) {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        const p = Math.max(1, parseInt(page));
        const ps = Math.min(100, Math.max(1, parseInt(pageSize)));
        const { items, total } = await testRepo.listByOwnerPaged(req.user.id, {
            page: p,
            pageSize: ps,
        });
        const summaries = items.map((t) => ({
            id: t.id,
            code: t.code,
            title: t.title,
            createdAt: t.created_at,
            expiresAt: t.expires_at,
        }));
        res.json({
            items: summaries,
            page: p,
            pageSize: ps,
            total,
            totalPages: Math.ceil(total / ps),
        });
    } catch (e) {
        next(e);
    }
}

// New: attempt detail for participant (only own if linked to user OR anonymous attempt by id with token? we restrict to linked user or owner)
export async function getAttemptDetail(req, res, next) {
    try {
        const { attemptId } = req.params;
        const attempt = await attemptRepo.findById(attemptId);
        if (!attempt)
            throw ApiError.notFound("Attempt not found", "ATTEMPT_NOT_FOUND");
        // If attempt belongs to a user enforce same user; else if no user we allow if client supplies attemptId + (optionally) token? Keep simple: if no user_id return answers without correct answers.
        const test = await testRepo.findById(attempt.test_id);
        const isOwner = test?.created_by && test.created_by === req.user?.id;
        const isUser = attempt.user_id && req.user?.id === attempt.user_id;
        if (attempt.user_id && !isUser && !isOwner)
            throw ApiError.forbidden("Forbidden", "FORBIDDEN_ATTEMPT_DETAIL");
        if (!attempt.submitted_at)
            throw ApiError.badRequest(
                "ATTEMPT_NOT_SUBMITTED",
                "Attempt not submitted"
            );
        const answers = await attemptAnswersRepo.listForAttempt(attemptId);
        // Hide correct answers if viewer is only the participant and not owner
        const hideCorrect = !isOwner;
        // Need original questions for explanations
        const questions = JSON.parse(test.questions_json);
        const detailed = answers.map((a) => {
            const q = questions.find((q) => q.id === a.question_id) || {};
            const correct = a.is_correct === 1;
            let hint = undefined;
            if (!correct) {
                // Derive hint from explanation without leaking answer
                const exp = (q.explanation || "").replace(
                    new RegExp(
                        `${(q.answer || "")
                            .toString()
                            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
                        "ig"
                    ),
                    ""
                );
                hint = exp ? exp.slice(0, 140).trim() : undefined;
            }
            return {
                questionId: a.question_id,
                question: a.question_text,
                userAnswer: a.user_answer || null,
                correct,
                correctAnswer: hideCorrect
                    ? undefined
                    : a.correct_answer || null,
                hint: hint,
            };
        });
        res.json({
            attemptId: attempt.id,
            testId: attempt.test_id,
            score: attempt.score,
            submittedAt: attempt.submitted_at,
            answers: detailed,
        });
    } catch (e) {
        next(e);
    }
}

// Owner: attempt detail with answers + correct answers always
export async function getOwnerAttemptDetail(req, res, next) {
    try {
        const { testId, attemptId } = req.params;
        const test = await testRepo.findById(testId);
        if (!test) throw ApiError.notFound("Test not found", "TEST_NOT_FOUND");
        if (test.created_by && test.created_by !== req.user?.id)
            throw ApiError.forbidden(
                "Forbidden",
                "FORBIDDEN_ATTEMPT_DETAIL_OWNER"
            );
        const attempt = await attemptRepo.findById(attemptId);
        if (!attempt || attempt.test_id !== testId)
            throw ApiError.notFound("Attempt not found", "ATTEMPT_NOT_FOUND");
        if (!attempt.submitted_at)
            throw ApiError.badRequest(
                "ATTEMPT_NOT_SUBMITTED",
                "Attempt not submitted"
            );
        const answers = await attemptAnswersRepo.listForAttempt(attemptId);
        const questions = JSON.parse(test.questions_json);
        const detailed = answers.map((a) => {
            const q = questions.find((q) => q.id === a.question_id) || {};
            return {
                questionId: a.question_id,
                question: a.question_text,
                userAnswer: a.user_answer || null,
                correctAnswer: a.correct_answer || null,
                isCorrect: a.is_correct === 1,
                explanation: q.explanation || null,
                reference: q.reference || null,
            };
        });
        res.json({
            attemptId: attempt.id,
            testId: attempt.test_id,
            participantName: attempt.participant_name,
            displayName: attempt.display_name,
            score: attempt.score,
            submittedAt: attempt.submitted_at,
            answers: detailed,
        });
    } catch (e) {
        next(e);
    }
}

// Leaderboard top N
export async function getLeaderboard(req, res, next) {
    try {
        const { testId } = req.params;
        const { limit = 10 } = req.query;
        const test = await testRepo.findById(testId);
        if (!test) throw ApiError.notFound("Test not found", "TEST_NOT_FOUND");
        const attempts = await attemptRepo.listByTest(testId);
        const filtered = attempts
            .filter((a) => a.score != null)
            .slice(0, Math.min(100, parseInt(limit) || 10));
        res.json({
            testId,
            leaderboard: filtered.map((a) => ({
                id: a.id,
                participantName: a.participant_name,
                displayName: a.display_name,
                score: a.score,
                submittedAt: a.submitted_at,
            })),
        });
    } catch (e) {
        next(e);
    }
}

// Close test early
export async function closeTest(req, res, next) {
    try {
        const { testId } = req.params;
        const test = await testRepo.findById(testId);
        if (!test) throw ApiError.notFound("Test not found", "TEST_NOT_FOUND");
        if (test.created_by && test.created_by !== req.user?.id)
            throw ApiError.forbidden("Forbidden", "FORBIDDEN_CLOSE_TEST");
        // Set expires_at to past
        const dbMod = await import("../db/index.js");
        const dbInstance = await dbMod.getDb();
        dbInstance.exec(
            `UPDATE tests SET expires_at=datetime('now','-1 minute') WHERE id='${testId}';`
        );
        res.json({ testId, closed: true });
    } catch (e) {
        next(e);
    }
}

// --- Review Test Endpoints ---
export async function generateReviewTest(req, res, next) {
    try {
        const { strategy, baseTestId, attemptId, questionCount, variantMode } =
            req.body;
        // Validate strategy
        if (!["wrong_recent", "spaced_repetition", "mix"].includes(strategy)) {
            throw ApiError.reviewStrategyUnsupported();
        }
        // Collect wrong answers context
        let sourceAttempts = [];
        let wrongAnswerRows = [];
        if (attemptId) {
            const att = await attemptRepo.findById(attemptId);
            if (!att || att.user_id !== req.user.id)
                throw ApiError.reviewInvalidContext();
            if (!att.submitted_at)
                throw ApiError.reviewInvalidContext("Attempt not submitted");
            // join answers
            const ansRepo = attemptAnswersRepo; // reuse
            wrongAnswerRows = (await ansRepo.listForAttempt(att.id)).filter(
                (a) => a.is_correct === 0
            );
            sourceAttempts.push(att.id);
        }
        if (baseTestId) {
            const baseTest = await testRepo.findById(baseTestId);
            if (!baseTest || baseTest.created_by !== req.user.id)
                throw ApiError.reviewInvalidContext("Base test not owned");
            const prior = await attemptRepo.listByTestAndUser(
                baseTestId,
                req.user.id
            );
            for (const p of prior) {
                sourceAttempts.push(p.id);
                const ans = await attemptAnswersRepo.listForAttempt(p.id);
                wrongAnswerRows.push(...ans.filter((a) => a.is_correct === 0));
            }
        }
        if (!wrongAnswerRows.length)
            throw ApiError.reviewInvalidContext(
                "No wrong answers to base review on"
            );
        // Derive synthetic source text: combine distinct question_text
        const distinctQuestions = Array.from(
            new Set(wrongAnswerRows.map((a) => a.question_text))
        ).slice(0, 100);
        const pseudoSource = distinctQuestions.join("\n").slice(0, 15000);
        const title = `Review Practice (${strategy})`;
        const test = await genService.generateFromText({
            sourceText: pseudoSource,
            filename: null,
            title,
            questionCount,
            difficulty: "medium",
            timeLimitSeconds: 60 * Math.max(3, Math.round(questionCount * 1.2)),
            expiresInMinutes: 60 * 24 * 7,
            extraInstructions: `Focus on reinforcing concepts the learner previously answered incorrectly. Strategy=${strategy}; VariantMode=${variantMode}`,
            params: { strategy, variantMode },
            createdBy: req.user.id,
        });
        // Mark as review (update row if not already flagged by repository). Simpler: direct update.
        const dbMod = await import("../db/index.js");
        const dbInstance = await dbMod.getDb();
        const attemptsJson = JSON.stringify(sourceAttempts).replace(/'/g, "''");
        dbInstance.exec(
            `UPDATE tests SET is_review=1, review_source_test_id=${
                baseTestId ? `'${baseTestId}'` : "NULL"
            }, review_origin_attempt_ids='${attemptsJson}', review_strategy='${strategy}' WHERE id='${
                test.id
            }';`
        );
        const updated = await testRepo.findById(test.id);
        res.status(201).json({
            id: updated.id,
            code: updated.code,
            isReview: true,
            strategy,
            questionCount,
            sourceAttempts,
            reviewSourceTestId: baseTestId || null,
        });
    } catch (e) {
        next(e);
    }
}

export async function listMyReviewTests(req, res, next) {
    try {
        const tests = await testRepo.listReviewByUser(req.user.id);
        res.json({
            items: tests.map((t) => ({
                id: t.id,
                code: t.code,
                title: t.title,
                createdAt: t.created_at,
                strategy: t.review_strategy,
                reviewSourceTestId: t.review_source_test_id,
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function getReviewRecommendations(req, res, next) {
    try {
        // Pull recent wrong answers
        const wrong = await attemptRepo.listWrongAnswersForUser({
            userId: req.user.id,
            limit: 200,
        });
        if (!wrong.length) return res.json({ recommendations: [] });
        const topics = extractTopicsFromWrongAnswers(wrong, { maxTopics: 8 });
        const blocks = synthesizeRecommendationBlocks(topics);
        res.json({ recommendations: blocks });
    } catch (e) {
        next(e);
    }
}
