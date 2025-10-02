import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
    generateTestSchema,
    startAttemptSchema,
    submitAttemptSchema,
} from "../utils/schemas.js";
import {
    generateTest,
    getTestByCode,
    startAttempt,
    submitAttempt,
    listTestAttempts,
    listMyAttempts,
    listMyTests,
    getAttemptDetail,
    getOwnerAttemptDetail,
    getLeaderboard,
    closeTest,
    generateReviewTest,
    listMyReviewTests,
    getReviewRecommendations,
} from "../controllers/testController.js";
import { reviewGenerateSchema } from "../utils/schemas.js";

const router = Router();

// Generation requires auth (for now)
router.post(
    "/generate",
    requireAuth,
    validate(generateTestSchema),
    generateTest
);
// Public fetch metadata & question shells
router.get("/code/:code", getTestByCode);
// Start attempt (anonymous allowed)
router.post("/start", optionalAuth, validate(startAttemptSchema), startAttempt);
// Submit answers
router.post("/submit", validate(submitAttemptSchema), submitAttempt);
// User view own attempts (must come before param route)
router.get("/me/attempts", requireAuth, listMyAttempts);
// User list own tests
router.get("/mine", requireAuth, listMyTests);
// Owner view attempts for a test
router.get("/:testId/attempts", requireAuth, listTestAttempts);
// Participant attempt detail (requires auth if attempt linked to user)
router.get("/attempt/:attemptId", requireAuth, getAttemptDetail);
// Owner attempt detail with answers
router.get("/:testId/attempts/:attemptId", requireAuth, getOwnerAttemptDetail);
// Leaderboard
router.get("/:testId/leaderboard", getLeaderboard);
// Close test early
router.post("/:testId/close", requireAuth, closeTest);

// Review / practice endpoints
router.post(
    "/review",
    requireAuth,
    validate(reviewGenerateSchema),
    generateReviewTest
);
router.get("/review/mine", requireAuth, listMyReviewTests);
router.get("/review/recommendations", requireAuth, getReviewRecommendations);

export default router;
