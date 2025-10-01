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
} from "../controllers/testController.js";

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

export default router;
