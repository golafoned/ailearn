import { Router } from "express";
import {
    getDashboard,
    getConcepts,
    getWeakConcepts,
    getDueReviews,
    createSession,
    completeSession,
    getConceptDetails,
    getProgressChart,
    getRecommendations,
    getAchievements,
    getSessionHistory,
} from "../controllers/learningController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    sessionCreateSchema,
    sessionCompleteSchema,
    conceptFilterSchema,
    progressChartSchema,
} from "../utils/schemas.js";

const router = Router();

// All learning routes require authentication
router.use(requireAuth);

// Phase 1: Critical endpoints
router.get("/dashboard", getDashboard);
router.get("/concepts", validate(conceptFilterSchema), getConcepts);
router.get("/weak-concepts", getWeakConcepts);
router.get("/due-reviews", getDueReviews);
router.post("/sessions/create", validate(sessionCreateSchema), createSession);
router.post(
    "/sessions/:sessionId/complete",
    validate(sessionCompleteSchema),
    completeSession
);

// Phase 2: High priority
router.get("/concepts/:name/details", getConceptDetails);
router.get("/progress-chart", validate(progressChartSchema), getProgressChart);

// Phase 3: Medium priority
router.get("/recommendations", getRecommendations);
router.get("/achievements", getAchievements);
router.get("/sessions/history", getSessionHistory);

export default router;
