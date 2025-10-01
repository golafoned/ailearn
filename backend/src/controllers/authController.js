import { AuthService } from "../services/authService.js";
import { UserRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/ApiError.js";

const authService = new AuthService();
const userRepo = new UserRepository();

export async function register(req, res, next) {
    try {
        const { email, password, displayName } = req.body;
        const user = await authService.register({
            email,
            password,
            displayName,
        });
        res.status(201).json({ user });
    } catch (e) {
        next(e);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refresh({ refreshToken });
        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function me(req, res, next) {
    try {
        if (!req.user) throw ApiError.unauthorized();
        const { id, email, display_name, created_at } = req.user;
        res.json({
            user: {
                id,
                email,
                displayName: display_name,
                createdAt: created_at,
            },
        });
    } catch (e) {
        next(e);
    }
}

export async function logout(req, res, next) {
    try {
        const userId = req.user.id;
        await authService.logoutAll(userId);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
}

export async function updateMe(req, res, next) {
    try {
        const { displayName } = req.body;
        if (!displayName || displayName.length < 1 || displayName.length > 50)
            throw ApiError.badRequest(
                "INVALID_DISPLAY_NAME",
                "Invalid displayName"
            );
        const updated = await userRepo.updateDisplayName(
            req.user.id,
            displayName
        );
        const { id, email, display_name, created_at } = updated;
        res.json({
            user: {
                id,
                email,
                displayName: display_name,
                createdAt: created_at,
            },
        });
    } catch (e) {
        next(e);
    }
}
