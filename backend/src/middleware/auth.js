import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserRepository } from "../repositories/userRepository.js";
const userRepo = new UserRepository();

export async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    try {
        const payload = jwt.verify(token, env.jwt.accessSecret);
        const full = await userRepo.findById(payload.sub);
        req.user = full || { id: payload.sub, email: payload.email };
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

export async function optionalAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    try {
        const payload = jwt.verify(token, env.jwt.accessSecret);
        const full = await userRepo.findById(payload.sub);
        req.user = full || { id: payload.sub, email: payload.email };
    } catch (e) {
        // ignore invalid token for optional auth
    }
    next();
}
