import { v4 as uuid } from "uuid";
import { UserConceptRepository } from "../repositories/userConceptRepository.js";
import { ConceptPracticeHistoryRepository } from "../repositories/conceptPracticeHistoryRepository.js";
import { PracticeSessionRepository } from "../repositories/practiceSessionRepository.js";
import {
    UserAchievementRepository,
    ConceptRelationshipRepository,
} from "../repositories/achievementConceptRepositories.js";
import { TestRepository } from "../repositories/testRepository.js";
import { TestAttemptRepository } from "../repositories/testAttemptRepository.js";
import { MasteryCalculationService } from "../services/masteryCalculationService.js";
import { AdaptiveQuestionService } from "../services/adaptiveQuestionService.js";
import { RecommendationService } from "../services/recommendationService.js";
import { AchievementService } from "../services/achievementService.js";
import { ConceptExtractionService } from "../services/conceptExtractionService.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";
import { generateCode } from "../utils/inviteCode.js";

const userConceptRepo = new UserConceptRepository();
const historyRepo = new ConceptPracticeHistoryRepository();
const sessionRepo = new PracticeSessionRepository();
const achievementRepo = new UserAchievementRepository();
const conceptRelRepo = new ConceptRelationshipRepository();
const testRepo = new TestRepository();
const testAttemptRepo = new TestAttemptRepository();

const masteryService = new MasteryCalculationService();
const adaptiveService = new AdaptiveQuestionService();
const recommendationService = new RecommendationService();
const achievementService = new AchievementService(achievementRepo);
const conceptService = new ConceptExtractionService();

// Helper: ensure concept row exists; if missing create with baseline values.
async function _ensureConcept(userId, conceptName) {
    let concept = await userConceptRepo.findByUserAndConcept(
        userId,
        conceptName
    );
    if (!concept) {
        concept = await userConceptRepo.create({
            id: uuid(),
            user_id: userId,
            concept_name: conceptName,
            mastery_level: 0,
            total_attempts: 0,
            correct_attempts: 0,
            last_practiced_at: null,
            next_review_due: null,
            difficulty_level: "easy",
            consecutive_correct: 0,
            consecutive_wrong: 0,
        });
        logger.info({ userId, concept: conceptName }, "Concept auto-created");
    }
    return concept;
}

// Helper: seed one attempt for concept if none exist
async function _seedAttemptIfNone(userId, conceptName) {
    const existing = await testAttemptRepo.listByConcept(userId, conceptName, {
        includeInProgress: true,
    });
    if (existing.length) return existing;
    const questionId = uuid();
    const question = {
        id: questionId,
        text: `Intro check: ${conceptName}?`,
        choices: ["Yes", "No"],
        answer: "Yes",
        difficulty: "easy",
        conceptTags: [conceptName],
    };
    const testId = uuid();
    const code = generateCode();
    await testRepo.create({
        id: testId,
        code,
        title: `Seed Attempt: ${conceptName}`,
        source_filename: null,
        source_text: `Auto-generated seed test for concept ${conceptName}`,
        model: "adaptive",
        params_json: { concepts: [conceptName], seed: true },
        questions_json: [question],
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        time_limit_seconds: 300,
        created_by: userId,
        is_review: 0,
        concepts_json: [conceptName],
        adaptive_mode: 1,
    });
    const attemptId = uuid();
    await testAttemptRepo.create({
        id: attemptId,
        test_id: testId,
        user_id: userId,
        participant_name: "You",
    });
    logger.info(
        { userId, concept: conceptName, attemptId },
        "Seed attempt created"
    );
    return testAttemptRepo.listByConcept(userId, conceptName, {
        includeInProgress: true,
    });
}

// GET /api/v1/learning/dashboard
export async function getDashboard(req, res, next) {
    try {
        const userId = req.user.id;

        // Get all user concepts
        const concepts = await userConceptRepo.findByUser(userId);
        const stats = await userConceptRepo.getStats(userId);
        const streak = await sessionRepo.getStreak(userId);
        const recentStats = await sessionRepo.getRecentStats(userId, 7);

        // Calculate weekly improvement
        const chartData = await historyRepo.getProgressChart(userId, "week");
        const improvement =
            chartData.length >= 2
                ? masteryService.calculateImprovement(
                      chartData[0].avg_mastery,
                      chartData[chartData.length - 1].avg_mastery
                  )
                : 0;

        res.json({
            overallProgress: Math.round(stats.avg_mastery),
            conceptsMastered: stats.mastered_count,
            dueForReview: stats.due_count,
            weeklyImprovement: improvement,
            currentStreak: streak,
            thisWeek: {
                sessionsCompleted: recentStats.session_count,
                averageScore: Math.round(recentStats.avg_score || 0),
                questionsAnswered: recentStats.total_questions || 0,
            },
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/v1/learning/concepts
export async function getConcepts(req, res, next) {
    try {
        const userId = req.user.id;
        const {
            filter = "all",
            sort = "mastery",
            limit = 50,
            offset = 0,
        } = req.query;

        const filters = {
            sort,
            limit: parseInt(limit),
            offset: parseInt(offset),
        };

        // Apply filters
        if (filter === "weak") {
            filters.masteryMax = 60;
        } else if (filter === "mastered") {
            filters.masteryMin = 80;
        } else if (filter === "learning") {
            filters.masteryMin = 40;
            filters.masteryMax = 79;
        } else if (filter === "due") {
            filters.isDue = true;
        }

        const concepts = await userConceptRepo.findByUser(userId, filters);

        // Enrich with due status
        const enriched = concepts.map((c) => ({
            name: c.concept_name,
            mastery: c.mastery_level,
            totalAttempts: c.total_attempts,
            correctAttempts: c.correct_attempts,
            lastPracticed: c.last_practiced_at,
            nextReview: c.next_review_due,
            isDue: c.next_review_due
                ? new Date(c.next_review_due) <= new Date()
                : false,
            difficulty: c.difficulty_level,
            consecutiveCorrect: c.consecutive_correct,
        }));

        res.json({
            concepts: enriched,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            pageSize: parseInt(limit),
            total: enriched.length,
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/v1/learning/weak-concepts
export async function getWeakConcepts(req, res, next) {
    try {
        const userId = req.user.id;
        const weak = await userConceptRepo.getWeakConcepts(userId, 10);

        const weakConcepts = weak.map((c) => ({
            name: c.concept_name,
            mastery: c.mastery_level,
            priority:
                c.mastery_level < 30
                    ? "high"
                    : c.mastery_level < 50
                    ? "medium"
                    : "low",
            attempts: c.total_attempts,
            lastPracticed: c.last_practiced_at,
            recommendation:
                c.mastery_level < 30
                    ? "Start with easy questions to build foundation"
                    : "Practice medium difficulty to improve",
        }));

        res.json({ weakConcepts });
    } catch (e) {
        next(e);
    }
}

// GET /api/v1/learning/due-reviews
export async function getDueReviews(req, res, next) {
    try {
        const userId = req.user.id;
        const dueReviews = await userConceptRepo.getDueReviews(userId, 1);

        const due = dueReviews.map((c) => {
            const dueDate = new Date(c.next_review_due);
            const now = new Date();
            const daysDiff = Math.floor(
                (now - dueDate) / (1000 * 60 * 60 * 24)
            );

            return {
                name: c.concept_name,
                mastery: c.mastery_level,
                dueDate: c.next_review_due,
                daysOverdue: daysDiff > 0 ? daysDiff : 0,
                priority:
                    daysDiff > 3 ? "high" : daysDiff > 0 ? "medium" : "low",
            };
        });

        res.json({
            dueCount: due.length,
            concepts: due,
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/v1/learning/sessions/create
export async function createSession(req, res, next) {
    try {
        const userId = req.user.id;
        const {
            sessionType,
            conceptSelection = "due",
            customConcepts = [],
            targetDifficulty = "adaptive",
            questionCount = 10,
        } = req.body;

        // Map API session types to database session types
        const sessionTypeMap = {
            quick_practice: "quick",
            focused_practice: "focused",
            mastery_check: "mastery",
            weak_concepts: "weak",
        };
        const dbSessionType = sessionTypeMap[sessionType] || sessionType;

        // Select concepts based on strategy
        let selectedConcepts = [];
        if (conceptSelection === "due") {
            const due = await userConceptRepo.getDueReviews(userId, 1);
            selectedConcepts = due.slice(0, 5);
        } else if (conceptSelection === "weak") {
            const weak = await userConceptRepo.getWeakConcepts(userId, 5);
            selectedConcepts = weak;
        } else if (conceptSelection === "random") {
            const all = await userConceptRepo.findByUser(userId, {
                limit: 100,
            });
            selectedConcepts = all.sort(() => Math.random() - 0.5).slice(0, 5);
        } else if (conceptSelection === "custom") {
            for (const name of customConcepts) {
                const c = await userConceptRepo.findByUserAndConcept(
                    userId,
                    name
                );
                if (c) selectedConcepts.push(c);
            }
        }

        if (selectedConcepts.length === 0) {
            // Fallback chain: if 'due' empty try weak, then random.
            if (conceptSelection === "due") {
                const weak = await userConceptRepo.getWeakConcepts(userId, 5);
                if (weak.length) selectedConcepts = weak;
            }
            if (selectedConcepts.length === 0) {
                const all = await userConceptRepo.findByUser(userId, {
                    limit: 50,
                });
                if (all.length) {
                    selectedConcepts = all
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 5);
                }
            }
            if (selectedConcepts.length === 0) {
                throw ApiError.badRequest(
                    "NO_CONCEPTS_AVAILABLE",
                    "No concepts available for practice. Start by completing any test or adaptive session to establish baseline concepts."
                );
            }
        }

        // Build mastery map
        const conceptNames = selectedConcepts.map((c) => c.concept_name);
        const masteryLevels = {};
        selectedConcepts.forEach((c) => {
            masteryLevels[c.concept_name] = c.mastery_level;
        });

        // Generate adaptive questions
        const questions = await adaptiveService.generateQuestions(
            conceptNames,
            masteryLevels,
            questionCount,
            userId
        );

        // Create test
        const testId = uuid();
        const code = generateCode();
        const test = await testRepo.create({
            id: testId,
            code,
            title: `${
                sessionType.charAt(0).toUpperCase() + sessionType.slice(1)
            } Practice`,
            source_filename: null,
            source_text: `Adaptive practice session for: ${conceptNames.join(
                ", "
            )}`,
            model: "adaptive",
            params_json: {
                sessionType,
                targetDifficulty,
                concepts: conceptNames,
            },
            questions_json: questions,
            expires_at: new Date(
                Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            time_limit_seconds: questionCount * 60,
            created_by: userId,
            adaptive_mode: 1,
            concepts_json: conceptNames,
        });

        // Create session record
        const sessionId = uuid();
        await sessionRepo.create({
            id: sessionId,
            user_id: userId,
            session_type: dbSessionType,
            concepts_json: conceptNames,
            target_difficulty: targetDifficulty,
            questions_total: questions.length,
            test_id: testId,
        });

        res.status(201).json({
            sessionId,
            testId,
            code,
            testCode: code, // add explicit testCode alias for frontend consistency
            sessionType,
            concepts: conceptNames.map((name) => {
                const c = selectedConcepts.find(
                    (sc) => sc.concept_name === name
                );
                return {
                    name,
                    currentMastery: c?.mastery_level || 0,
                };
            }),
            questionCount: questions.length,
            estimatedMinutes: Math.ceil(questions.length * 1.5),
            adaptiveMode: true,
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/v1/learning/sessions/:sessionId/complete
export async function completeSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const { answers, timeSpent } = req.body;
        const userId = req.user.id;

        const session = await sessionRepo.findById(sessionId);
        if (!session) {
            throw ApiError.notFound("Session not found", "SESSION_NOT_FOUND");
        }
        if (session.user_id !== userId) {
            throw ApiError.forbidden("Not your session", "FORBIDDEN_SESSION");
        }
        if (session.completed_at) {
            throw ApiError.badRequest(
                "Session already completed",
                "SESSION_ALREADY_COMPLETED"
            );
        }

        // Get test and questions
        const test = await testRepo.findById(session.test_id);
        const questions = JSON.parse(test.questions_json);

        // Grade answers
        let correctCount = 0;
        const conceptChanges = {};

        for (const answer of answers) {
            const question = questions.find((q) => q.id === answer.questionId);
            if (!question) continue;

            const isCorrect =
                String(question.answer).trim().toLowerCase() ===
                String(answer.answer).trim().toLowerCase();
            if (isCorrect) correctCount++;

            // Track concept performance
            const concepts = question.conceptTags || [];
            for (const conceptName of concepts) {
                if (!conceptChanges[conceptName]) {
                    conceptChanges[conceptName] = {
                        correct: 0,
                        total: 0,
                        difficulty: question.difficulty,
                    };
                }
                conceptChanges[conceptName].total++;
                if (isCorrect) conceptChanges[conceptName].correct++;
            }

            // Record history
            for (const conceptName of concepts) {
                const concept = await userConceptRepo.findByUserAndConcept(
                    userId,
                    conceptName
                );
                const masteryBefore = concept?.mastery_level || 0;
                const masteryAfter = masteryService.calculateMasteryChange(
                    masteryBefore,
                    question.difficulty || "medium",
                    isCorrect
                );

                await historyRepo.create({
                    id: uuid(),
                    user_id: userId,
                    concept_name: conceptName,
                    session_id: sessionId,
                    question_difficulty: question.difficulty || "medium",
                    was_correct: isCorrect ? 1 : 0,
                    mastery_before: masteryBefore,
                    mastery_after: masteryAfter,
                    time_spent_seconds: Math.floor(
                        (timeSpent || 0) / answers.length
                    ),
                });
            }
        }

        // Update concept mastery
        const masteryUpdates = [];
        for (const [conceptName, stats] of Object.entries(conceptChanges)) {
            let concept = await userConceptRepo.findByUserAndConcept(
                userId,
                conceptName
            );

            if (!concept) {
                // Create new concept
                concept = await userConceptRepo.create({
                    id: uuid(),
                    user_id: userId,
                    concept_name: conceptName,
                    mastery_level: 0,
                    total_attempts: 0,
                    correct_attempts: 0,
                    difficulty_level: "easy",
                });
            }

            const oldMastery = concept.mastery_level;
            const avgCorrect = stats.correct / stats.total;
            const newMastery = masteryService.calculateMasteryChange(
                oldMastery,
                stats.difficulty || "medium",
                avgCorrect > 0.5
            );

            const consecutiveCorrect =
                avgCorrect === 1 ? (concept.consecutive_correct || 0) + 1 : 0;
            const nextReview = masteryService.calculateNextReviewDate(
                newMastery,
                consecutiveCorrect
            );

            await userConceptRepo.update(userId, conceptName, {
                mastery_level: newMastery,
                total_attempts: concept.total_attempts + stats.total,
                correct_attempts: concept.correct_attempts + stats.correct,
                last_practiced_at: new Date().toISOString(),
                next_review_due: nextReview,
                difficulty_level: masteryService.suggestDifficulty(newMastery),
                consecutive_correct: consecutiveCorrect,
                consecutive_wrong:
                    avgCorrect === 0 ? (concept.consecutive_wrong || 0) + 1 : 0,
            });

            masteryUpdates.push({
                concept: conceptName,
                before: oldMastery,
                after: newMastery,
                change: newMastery - oldMastery,
            });
        }

        // Complete session
        const scorePercentage = Math.round(
            (correctCount / answers.length) * 100
        );
        await sessionRepo.complete(sessionId, {
            questions_correct: correctCount,
            score_percentage: scorePercentage,
            duration_seconds: timeSpent,
        });

        // Check achievements
        const stats = await userConceptRepo.getStats(userId);
        const sessionCount = await sessionRepo.countByUser(userId);
        const streak = await sessionRepo.getStreak(userId);

        const newAchievements = await achievementService.checkAchievements(
            userId,
            "session_complete",
            {
                sessionCount,
                perfectSession: scorePercentage === 100,
                perfectCount: scorePercentage === 100 ? 1 : 0,
            }
        );

        await achievementService.checkAchievements(userId, "concept_mastered", {
            masteredCount: stats.mastered_count,
        });

        await achievementService.checkAchievements(userId, "streak_update", {
            streak,
        });

        // Get recommendations
        const allConcepts = await userConceptRepo.findByUser(userId);
        const recentHistory = await historyRepo.getRecentWrongAnswers(
            userId,
            50
        );
        const recommendations =
            await recommendationService.getPersonalizedRecommendations(
                userId,
                allConcepts,
                recentHistory
            );

        res.json({
            sessionId,
            score: scorePercentage,
            correctCount,
            totalQuestions: answers.length,
            masteryChanges: masteryUpdates,
            newAchievements: newAchievements.map((a) => ({
                name: a.achievement_name,
                description: a.description,
            })),
            nextSteps: recommendations.slice(0, 3).map((r) => ({
                type: r.type,
                concept: r.conceptName,
                action: r.action,
            })),
        });
    } catch (e) {
        next(e);
    }
}

// Additional endpoints continue below...
export async function getConceptDetails(req, res, next) {
    try {
        const userId = req.user.id;
        const { name } = req.params;
        const concept = await _ensureConcept(userId, name);

        const history = await historyRepo.findByUserAndConcept(
            userId,
            name,
            50
        );
        const prerequisites = await conceptRelRepo.findPrerequisites(name);
        const attempts = await testAttemptRepo.listByConcept(userId, name, {
            includeInProgress: true,
        });

        // Calculate trend
        const recentHistory = history.slice(0, 10).reverse();
        const chartData = recentHistory.map((h) => ({
            date: h.created_at,
            mastery: h.mastery_after,
        }));

        res.json({
            concept: {
                name: concept.concept_name,
                mastery: concept.mastery_level,
                totalAttempts: concept.total_attempts,
                accuracy:
                    concept.total_attempts > 0
                        ? Math.round(
                              (concept.correct_attempts /
                                  concept.total_attempts) *
                                  100
                          )
                        : 0,
                lastPracticed: concept.last_practiced_at,
                nextReview: concept.next_review_due,
                difficulty: concept.difficulty_level,
            },
            history: chartData,
            prerequisites: prerequisites.map((p) => p.prerequisite_name),
            relatedConcepts: [],
            attempts: attempts.map((a) => ({
                attemptId: a.attempt_id,
                testId: a.test_id,
                testCode: a.test_code,
                testTitle: a.test_title,
                status: a.status,
                score: a.score,
                submittedAt: a.submitted_at,
                startedAt: a.started_at,
                answered: a.answered_count,
                correct: a.correct_count,
                accuracy:
                    a.answered_count > 0
                        ? Math.round((a.correct_count / a.answered_count) * 100)
                        : null,
                attemptLink:
                    a.status === "completed"
                        ? `/api/v1/tests/attempts/${a.attempt_id}/results`
                        : null,
                testLink: `/api/v1/tests/${a.test_code}`,
            })),
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/v1/learning/concepts/:name/attempts
export async function getConceptAttempts(req, res, next) {
    try {
        const userId = req.user.id;
        const { name } = req.params;
        const { limit = 25, offset = 0 } = req.query;
        logger.info({ userId, concept: name }, "getConceptAttempts hit");
        await _ensureConcept(userId, name);
        let attempts = await testAttemptRepo.listByConcept(userId, name, {
            includeInProgress: true,
        });
        if (!attempts.length) {
            attempts = await _seedAttemptIfNone(userId, name);
        }
        const sliced = attempts.slice(
            parseInt(offset),
            parseInt(offset) + parseInt(limit)
        );

        res.json({
            concept: name,
            total: attempts.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attempts: sliced.map((a) => ({
                attemptId: a.attempt_id,
                testId: a.test_id,
                testCode: a.test_code,
                testTitle: a.test_title,
                status: a.status,
                score: a.score,
                submittedAt: a.submitted_at,
                startedAt: a.started_at,
                answered: a.answered_count,
                correct: a.correct_count,
                accuracy:
                    a.answered_count > 0
                        ? Math.round((a.correct_count / a.answered_count) * 100)
                        : null,
                attemptLink:
                    a.status === "completed"
                        ? `/api/v1/tests/attempts/${a.attempt_id}/results`
                        : null,
                testLink: `/api/v1/tests/${a.test_code}`,
            })),
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/v1/learning/concepts/:name/attempts/ensure
// Creates a minimal adaptive test + attempt for the concept if user has none.
export async function ensureConceptAttempt(req, res, next) {
    try {
        const userId = req.user.id;
        const { name } = req.params;
        logger.info({ userId, concept: name }, "ensureConceptAttempt hit");
        await _ensureConcept(userId, name);
        const existing = await testAttemptRepo.listByConcept(userId, name, {
            includeInProgress: true,
        });
        if (existing.length) {
            return res.json({
                created: false,
                attemptId: existing[0].attempt_id,
            });
        }
        const seeded = await _seedAttemptIfNone(userId, name);
        return res.status(201).json({
            created: true,
            attemptId: seeded[0].attempt_id,
            testId: seeded[0].test_id,
            code: seeded[0].test_code,
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/v1/learning/concept-attempts?concept=Name&limit=25&offset=0&autoEnsure=1
export async function queryConceptAttempts(req, res, next) {
    try {
        const userId = req.user.id;
        const {
            concept: conceptName,
            limit = 25,
            offset = 0,
            autoEnsure,
        } = req.query;
        logger.info(
            { userId, concept: conceptName, autoEnsure },
            "queryConceptAttempts hit"
        );
        if (!conceptName) {
            return res.status(400).json({
                error: {
                    code: "MISSING_CONCEPT",
                    message: "concept query parameter required",
                },
            });
        }
        const concept = await userConceptRepo.findByUserAndConcept(
            userId,
            conceptName
        );
        if (!concept) {
            // return empty instead of 404 so frontend can treat as no data
            return res.json({
                concept: conceptName,
                total: 0,
                limit: parseInt(limit),
                offset: parseInt(offset),
                attempts: [],
            });
        }
        let attempts = await testAttemptRepo.listByConcept(
            userId,
            conceptName,
            { includeInProgress: true }
        );
        if (!attempts.length && String(autoEnsure) === "1") {
            // Attempt auto seed
            const questionId = uuid();
            const question = {
                id: questionId,
                text: `Quick check: recall for ${conceptName}?`,
                choices: ["Yes", "No"],
                answer: "Yes",
                difficulty: "easy",
                conceptTags: [conceptName],
            };
            const testId = uuid();
            const code = generateCode();
            await testRepo.create({
                id: testId,
                code,
                title: `Seed Attempt: ${conceptName}`,
                source_filename: null,
                source_text: `Auto-generated seed test for concept ${conceptName}`,
                model: "adaptive",
                params_json: { concepts: [conceptName], seed: true },
                questions_json: [question],
                expires_at: new Date(
                    Date.now() + 6 * 60 * 60 * 1000
                ).toISOString(),
                time_limit_seconds: 300,
                created_by: userId,
                is_review: 0,
                concepts_json: [conceptName],
                adaptive_mode: 1,
            });
            const attemptId = uuid();
            await testAttemptRepo.create({
                id: attemptId,
                test_id: testId,
                user_id: userId,
                participant_name: "You",
            });
            attempts = await testAttemptRepo.listByConcept(
                userId,
                conceptName,
                { includeInProgress: true }
            );
        }
        const sliced = attempts.slice(
            parseInt(offset),
            parseInt(offset) + parseInt(limit)
        );
        res.json({
            concept: conceptName,
            total: attempts.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attempts: sliced.map((a) => ({
                attemptId: a.attempt_id,
                testId: a.test_id,
                testCode: a.test_code,
                testTitle: a.test_title,
                status: a.status,
                score: a.score,
                submittedAt: a.submitted_at,
                startedAt: a.started_at,
                answered: a.answered_count,
                correct: a.correct_count,
                accuracy:
                    a.answered_count > 0
                        ? Math.round((a.correct_count / a.answered_count) * 100)
                        : null,
                attemptLink:
                    a.status === "completed"
                        ? `/api/v1/tests/attempts/${a.attempt_id}/results`
                        : null,
                testLink: `/api/v1/tests/${a.test_code}`,
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function getProgressChart(req, res, next) {
    try {
        const userId = req.user.id;
        const { period = "month" } = req.query;

        const data = await historyRepo.getProgressChart(userId, period);

        const improvement =
            data.length >= 2
                ? masteryService.calculateImprovement(
                      data[0].avg_mastery,
                      data[data.length - 1].avg_mastery
                  )
                : 0;

        res.json({
            period,
            dataPoints: data.map((d) => ({
                date: d.date,
                averageMastery: Math.round(d.avg_mastery),
                conceptsPracticed: d.concepts_practiced,
                accuracy:
                    d.total_attempts > 0
                        ? Math.round((d.correct_count / d.total_attempts) * 100)
                        : 0,
            })),
            improvementPercentage: improvement,
        });
    } catch (e) {
        next(e);
    }
}

export async function getRecommendations(req, res, next) {
    try {
        const userId = req.user.id;
        const concepts = await userConceptRepo.findByUser(userId);
        const history = await historyRepo.getRecentWrongAnswers(userId, 100);

        const recommendations =
            await recommendationService.getPersonalizedRecommendations(
                userId,
                concepts,
                history
            );

        res.json({ recommendations });
    } catch (e) {
        next(e);
    }
}

export async function getAchievements(req, res, next) {
    try {
        const userId = req.user.id;
        const progress = await achievementService.getAchievementProgress(
            userId
        );
        const stats = await userConceptRepo.getStats(userId);
        const sessionCount = await sessionRepo.countByUser(userId);

        res.json({
            level: {
                current: Math.min(6, Math.floor(stats.mastered_count / 10) + 1),
                name: _getLevelName(stats.mastered_count),
                progress: stats.mastered_count,
                nextMilestone: Math.ceil((stats.mastered_count + 1) / 10) * 10,
            },
            totalEarned: progress.earnedCount,
            totalAvailable: progress.totalCount,
            earned: progress.earned,
            inProgress: progress.inProgress,
        });
    } catch (e) {
        next(e);
    }
}

export async function getSessionHistory(req, res, next) {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;

        const sessions = await sessionRepo.findByUser(
            userId,
            parseInt(limit),
            parseInt(offset)
        );
        const total = await sessionRepo.countByUser(userId);

        res.json({
            sessions: sessions.map((s) => ({
                id: s.id,
                type: s.session_type,
                concepts: JSON.parse(s.concepts_json || "[]"),
                score: s.score_percentage,
                questionsTotal: s.questions_total,
                questionsCorrect: s.questions_correct,
                duration: s.duration_seconds,
                completedAt: s.completed_at,
            })),
            total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        });
    } catch (e) {
        next(e);
    }
}

function _getLevelName(masteredCount) {
    if (masteredCount < 10) return "Beginner";
    if (masteredCount < 25) return "Learner";
    if (masteredCount < 50) return "Student";
    if (masteredCount < 100) return "Scholar";
    if (masteredCount < 200) return "Expert";
    return "Master";
}
