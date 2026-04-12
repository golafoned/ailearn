import { queryOne, queryAll, run } from "../db/index.js";

export class TestRepository {
    async create(test) {
        const conceptsJson = Array.isArray(test.concepts_json)
            ? JSON.stringify(test.concepts_json)
            : test.concepts_json || null;
        const adaptiveMode = test.adaptive_mode || test.adaptiveMode ? 1 : 0;
        const difficultyDist = test.difficulty_distribution
            ? JSON.stringify(test.difficulty_distribution)
            : null;

        await run(`INSERT INTO tests (
            id, code, title, source_filename, source_text, model, params_json, questions_json, expires_at, time_limit_seconds, created_by,
            is_review, review_source_test_id, review_origin_attempt_ids, review_strategy,
            concepts_json, adaptive_mode, difficulty_distribution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            test.id,
            test.code,
            test.title,
            test.source_filename || null,
            test.source_text,
            test.model,
            JSON.stringify(test.params_json),
            JSON.stringify(test.questions_json),
            test.expires_at,
            test.time_limit_seconds,
            test.created_by || null,
            test.is_review ? 1 : 0,
            test.review_source_test_id || null,
            test.review_origin_attempt_ids ? JSON.stringify(test.review_origin_attempt_ids) : null,
            test.review_strategy || null,
            conceptsJson,
            adaptiveMode,
            difficultyDist,
        ]);
        return this.findById(test.id);
    }

    async findByCode(code) {
        return queryOne(`SELECT * FROM tests WHERE code=? LIMIT 1`, [code]);
    }

    async findById(id) {
        return queryOne(`SELECT * FROM tests WHERE id=? LIMIT 1`, [id]);
    }

    async listByOwner(userId) {
        return queryAll(`SELECT * FROM tests WHERE created_by=? ORDER BY created_at DESC`, [userId]);
    }

    async listByOwnerPaged(userId, { page, pageSize }) {
        const offset = (page - 1) * pageSize;
        const items = await queryAll(
            `SELECT * FROM tests WHERE created_by=? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [userId, pageSize, offset]
        );
        const countRow = await queryOne(
            `SELECT COUNT(*) as c FROM tests WHERE created_by=?`,
            [userId]
        );
        return { items, total: countRow?.c || 0 };
    }

    async createReviewTest(data) {
        return this.create({ ...data, is_review: true });
    }

    async listReviewByUser(userId) {
        return queryAll(
            `SELECT * FROM tests WHERE created_by=? AND is_review=1 ORDER BY created_at DESC`,
            [userId]
        );
    }
}
