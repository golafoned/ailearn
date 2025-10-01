import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../config/env.js";
import { UserRepository } from "../repositories/userRepository.js";
import { RefreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { ApiError } from "../utils/ApiError.js";

const userRepo = new UserRepository();
const refreshRepo = new RefreshTokenRepository();

function signAccessToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, env.jwt.accessSecret, {
        expiresIn: env.jwt.accessExpires,
    });
}
function signRefreshToken(user, jti) {
    return jwt.sign({ sub: user.id, jti }, env.jwt.refreshSecret, {
        expiresIn: env.jwt.refreshExpires,
    });
}

export class AuthService {
    async register({ email, password, displayName }) {
        const existing = await userRepo.findByEmail(email.toLowerCase());
        if (existing)
            throw ApiError.conflict("Email already registered", "EMAIL_TAKEN");
        const password_hash = await bcrypt.hash(password, 10);
        const user = await userRepo.create({
            id: uuid(),
            email: email.toLowerCase(),
            password_hash,
            display_name: displayName || null,
        });
        return {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
        };
    }

    async login({ email, password }) {
        const user = await userRepo.findByEmail(email.toLowerCase());
        if (!user)
            throw ApiError.unauthorized(
                "Invalid credentials",
                "INVALID_CREDENTIALS"
            );
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok)
            throw ApiError.unauthorized(
                "Invalid credentials",
                "INVALID_CREDENTIALS"
            );
        return this._issueTokens(user);
    }

    async refresh({ refreshToken }) {
        try {
            const payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
            const record = await refreshRepo.find(refreshToken);
            if (!record || record.revoked)
                throw ApiError.unauthorized(
                    "Invalid token",
                    "INVALID_REFRESH_TOKEN"
                );
            if (new Date(record.expires_at) < new Date())
                throw ApiError.unauthorized(
                    "Expired token",
                    "EXPIRED_REFRESH_TOKEN"
                );
            await refreshRepo.revoke(refreshToken);
            const user = await userRepo.findById(payload.sub);
            if (!user)
                throw ApiError.notFound("User not found", "USER_NOT_FOUND");
            return this._issueTokens(user);
        } catch (e) {
            throw ApiError.unauthorized(
                "Invalid refresh token",
                "INVALID_REFRESH_TOKEN"
            );
        }
    }

    async logoutAll(userId) {
        await refreshRepo.deleteByUser(userId);
    }

    async _issueTokens(user) {
        const jti = uuid();
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user, jti);
        const decoded = jwt.decode(refreshToken);
        const expiresAt = new Date(decoded.exp * 1000).toISOString();
        await refreshRepo.add({
            id: jti,
            user_id: user.id,
            token: refreshToken,
            expires_at: expiresAt,
            revoked: 0,
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
            },
        };
    }
}
