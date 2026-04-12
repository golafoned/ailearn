import { queryOne, queryAll, run } from "../db/index.js";

export class UserConceptRepository {
    async findByUserAndConcept(userId, conceptName) {
        return queryOne(
            `SELECT * FROM user_concepts WHERE user_id=? AND concept_name=? LIMIT 1`,
            [userId, conceptName]
        );
    }

    async findByUser(userId, filters = {}) {
        let where = `user_id=?`;
        const params = [userId];

        if (filters.masteryMin !== undefined) {
            where += ` AND mastery_level >= ?`;
            params.push(filters.masteryMin);
        }
        if (filters.masteryMax !== undefined) {
            where += ` AND mastery_level <= ?`;
            params.push(filters.masteryMax);
        }
        if (filters.isDue) {
            where += ` AND next_review_due <= datetime('now')`;
        }

        let orderBy = "mastery_level DESC";
        if (filters.sort === "mastery") orderBy = "mastery_level DESC";
        if (filters.sort === "due") orderBy = "next_review_due ASC";
        if (filters.sort === "recent") orderBy = "last_practiced_at DESC";
        if (filters.sort === "name") orderBy = "concept_name ASC";

        const limit = filters.limit || 100;
        const offset = filters.offset || 0;
        params.push(limit, offset);

        return queryAll(
            `SELECT * FROM user_concepts WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
            params
        );
    }

    async create(concept) {
        await run(`INSERT INTO user_concepts (
            id, user_id, concept_name, mastery_level, total_attempts, correct_attempts,
            last_practiced_at, next_review_due, difficulty_level, consecutive_correct, consecutive_wrong
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            concept.id,
            concept.user_id,
            concept.concept_name,
            concept.mastery_level || 0,
            concept.total_attempts || 0,
            concept.correct_attempts || 0,
            concept.last_practiced_at || null,
            concept.next_review_due || null,
            concept.difficulty_level || "easy",
            concept.consecutive_correct || 0,
            concept.consecutive_wrong || 0,
        ]);
        return this.findByUserAndConcept(concept.user_id, concept.concept_name);
    }

    async update(userId, conceptName, updates) {
        const sets = [];
        const params = [];

        if (updates.mastery_level !== undefined) {
            sets.push(`mastery_level=?`);
            params.push(updates.mastery_level);
        }
        if (updates.total_attempts !== undefined) {
            sets.push(`total_attempts=?`);
            params.push(updates.total_attempts);
        }
        if (updates.correct_attempts !== undefined) {
            sets.push(`correct_attempts=?`);
            params.push(updates.correct_attempts);
        }
        if (updates.last_practiced_at) {
            sets.push(`last_practiced_at=?`);
            params.push(updates.last_practiced_at);
        }
        if (updates.next_review_due) {
            sets.push(`next_review_due=?`);
            params.push(updates.next_review_due);
        }
        if (updates.difficulty_level) {
            sets.push(`difficulty_level=?`);
            params.push(updates.difficulty_level);
        }
        if (updates.consecutive_correct !== undefined) {
            sets.push(`consecutive_correct=?`);
            params.push(updates.consecutive_correct);
        }
        if (updates.consecutive_wrong !== undefined) {
            sets.push(`consecutive_wrong=?`);
            params.push(updates.consecutive_wrong);
        }
        sets.push(`updated_at=datetime('now')`);

        params.push(userId, conceptName);
        await run(
            `UPDATE user_concepts SET ${sets.join(", ")} WHERE user_id=? AND concept_name=?`,
            params
        );
        return this.findByUserAndConcept(userId, conceptName);
    }

    async getStats(userId) {
        const result = await queryOne(`
            SELECT 
                COUNT(*) as total_concepts,
                COALESCE(AVG(mastery_level), 0) as avg_mastery,
                SUM(CASE WHEN mastery_level >= 80 THEN 1 ELSE 0 END) as mastered_count,
                SUM(CASE WHEN mastery_level < 40 THEN 1 ELSE 0 END) as weak_count,
                SUM(CASE WHEN next_review_due <= datetime('now') THEN 1 ELSE 0 END) as due_count
            FROM user_concepts WHERE user_id=?
        `, [userId]);
        return result || {
            total_concepts: 0,
            avg_mastery: 0,
            mastered_count: 0,
            weak_count: 0,
            due_count: 0,
        };
    }

    async getDueReviews(userId, daysAhead = 1) {
        return queryAll(`
            SELECT * FROM user_concepts 
            WHERE user_id=? AND next_review_due <= datetime('now', '+' || ? || ' days')
            ORDER BY next_review_due ASC, mastery_level ASC
        `, [userId, daysAhead]);
    }

    async getWeakConcepts(userId, limit = 10) {
        return queryAll(`
            SELECT * FROM user_concepts 
            WHERE user_id=? AND mastery_level < 60
            ORDER BY mastery_level ASC, last_practiced_at DESC
            LIMIT ?
        `, [userId, limit]);
    }
}
