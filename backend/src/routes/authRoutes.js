import { Router } from "express";
import {
    register,
    login,
    refresh,
    me,
    logout,
    updateMe,
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";
import {
    registerSchema,
    loginSchema,
    refreshSchema,
    updateMeSchema,
} from "../utils/schemas.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validate(updateMeSchema), updateMe);
router.post("/logout", requireAuth, logout);

export default router;
