import { AuthService } from "../services/authService.js";
import { UserRepository } from "../repositories/userRepository.js";

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

export async function me(req, res) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id, email, display_name, created_at } = req.user;
    res.json({ user: { id, email, displayName: display_name, createdAt: created_at } });
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
            return res.status(400).json({ error: "Invalid displayName" });
        const updated = await userRepo.updateDisplayName(
            req.user.id,
            displayName
        );
    const { id, email, display_name, created_at } = updated;
    res.json({ user: { id, email, displayName: display_name, createdAt: created_at } });
    } catch (e) {
        next(e);
    }
}
