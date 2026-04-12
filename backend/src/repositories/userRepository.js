import { queryOne, queryAll, run } from "../db/index.js";

export class UserRepository {
    async create(user) {
        const { id, email, password_hash, display_name } = user;
        await run(
            `INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)`,
            [id, email, password_hash, display_name || null]
        );
        return this.findById(id);
    }

    async findByEmail(email) {
        return queryOne(`SELECT * FROM users WHERE email=?`, [email]);
    }

    async findById(id) {
        return queryOne(`SELECT * FROM users WHERE id=?`, [id]);
    }

    async updateDisplayName(id, displayName) {
        await run(`UPDATE users SET display_name=? WHERE id=?`, [displayName, id]);
        return this.findById(id);
    }
}
