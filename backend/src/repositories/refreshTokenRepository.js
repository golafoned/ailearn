import { queryOne, run } from "../db/index.js";

export class RefreshTokenRepository {
    async add(token) {
        const { id, user_id, token: t, expires_at, revoked } = token;
        await run(
            `INSERT INTO refresh_tokens (id, user_id, token, expires_at, revoked) VALUES (?, ?, ?, ?, ?)`,
            [id, user_id, t, expires_at, revoked]
        );
        return token;
    }

    async find(token) {
        return queryOne(`SELECT * FROM refresh_tokens WHERE token=?`, [token]);
    }

    async revoke(token) {
        await run(`UPDATE refresh_tokens SET revoked = 1 WHERE token=?`, [token]);
    }

    async deleteByUser(userId) {
        await run(`DELETE FROM refresh_tokens WHERE user_id=?`, [userId]);
    }
}
