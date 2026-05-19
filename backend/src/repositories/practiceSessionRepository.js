import { queryOne, queryAll, run } from "../db/index.js";

export class PracticeSessionRepository {
    async create(session) {
        const conceptsJson = session.concepts_json
            ? JSON.stringify(session.concepts_json)
            : null;
        await run(
            `INSERT INTO practice_sessions (
            id, user_id, session_type, concepts_json, target_difficulty, 
            questions_total, questions_correct, score_percentage, test_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                session.id,
                session.user_id,
                session.session_type,
                conceptsJson,
                session.target_difficulty || null,
                session.questions_total || null,
                session.questions_correct || null,
                session.score_percentage || null,
                session.test_id || null,
            ],
        );
        return this.findById(session.id);
    }

    async findById(id) {
        return queryOne(`SELECT * FROM practice_sessions WHERE id=? LIMIT 1`, [
            id,
        ]);
    }

    async complete(sessionId, data) {
        const sets = [];
        const params = [];
        if (data.questions_correct !== undefined) {
            sets.push(`questions_correct=?`);
            params.push(data.questions_correct);
        }
        if (data.score_percentage !== undefined) {
            sets.push(`score_percentage=?`);
            params.push(data.score_percentage);
        }
        if (data.duration_seconds !== undefined) {
            sets.push(`duration_seconds=?`);
            params.push(data.duration_seconds);
        }
        sets.push(`completed_at=datetime('now')`);
        params.push(sessionId);

        await run(
            `UPDATE practice_sessions SET ${sets.join(", ")} WHERE id=?`,
            params,
        );
        return this.findById(sessionId);
    }

    async findByUser(userId, limit = 50, offset = 0) {
        return queryAll(
            `
            SELECT * FROM practice_sessions 
            WHERE user_id=? AND completed_at IS NOT NULL
            ORDER BY completed_at DESC 
            LIMIT ? OFFSET ?
        `,
            [userId, limit, offset],
        );
    }

    async countByUser(userId) {
        const row = await queryOne(
            `SELECT COUNT(*) as count FROM practice_sessions WHERE user_id=? AND completed_at IS NOT NULL`,
            [userId],
        );
        return row?.count || 0;
    }

    async countPerfectByUser(userId) {
        const row = await queryOne(
            `SELECT COUNT(*) as count FROM practice_sessions WHERE user_id=? AND completed_at IS NOT NULL AND score_percentage = 100`,
            [userId],
        );
        return row?.count || 0;
    }

    async getStreak(userId) {
        const sessions = await queryAll(
            `
            SELECT DISTINCT date(completed_at) as practice_date 
            FROM practice_sessions 
            WHERE user_id=? AND completed_at IS NOT NULL
            ORDER BY practice_date DESC
        `,
            [userId],
        );

        if (!sessions.length) return 0;

        let streak = 0;
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0];

        // Streak starts from today or yesterday (user may not have practiced today yet)
        let checkDate;
        if (sessions[0].practice_date === today) {
            checkDate = today;
        } else if (sessions[0].practice_date === yesterday) {
            checkDate = yesterday;
        } else {
            return 0; // Gap > 1 day, streak broken
        }

        for (const session of sessions) {
            if (session.practice_date === checkDate) {
                streak++;
                const d = new Date(checkDate);
                d.setDate(d.getDate() - 1);
                checkDate = d.toISOString().split("T")[0];
            } else {
                break;
            }
        }

        return streak;
    }

    async getRecentStats(userId, days = 7) {
        const result = await queryOne(
            `
            SELECT 
                COUNT(*) as session_count,
                AVG(score_percentage) as avg_score,
                SUM(questions_total) as total_questions
            FROM practice_sessions
            WHERE user_id=? AND completed_at >= datetime('now', '-' || ? || ' days')
        `,
            [userId, days],
        );
        return result || { session_count: 0, avg_score: 0, total_questions: 0 };
    }
}
