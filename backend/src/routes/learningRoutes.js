import { Router } from "express";
import {
    getDashboard,
    getConcepts,
    getWeakConcepts,
    getDueReviews,
    createSession,
    completeSession,
    getConceptDetails,
    getConceptAttempts,
    ensureConceptAttempt,
    queryConceptAttempts,
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
router.get("/concepts/:name/attempts", getConceptAttempts);
router.post("/concepts/:name/attempts/ensure", ensureConceptAttempt);
router.get("/concept-attempts", queryConceptAttempts);
router.get("/progress-chart", validate(progressChartSchema), getProgressChart);

// Phase 3: Medium priority
router.get("/recommendations", getRecommendations);
router.get("/achievements", getAchievements);
router.get("/sessions/history", getSessionHistory);

// Debug: list registered learning routes (remove in production)
router.get("/_routes", (req, res) => {
    const stack = router.stack
        .filter((l) => l.route)
        .map((l) => ({
            path:
                Object.keys(l.route.methods)
                    .map((m) => m.toUpperCase())
                    .join(", ") +
                " " +
                l.route.path,
        }));
    res.json({ routes: stack });
});

export default router;
