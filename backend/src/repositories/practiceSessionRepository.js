import { getDb } from "../db/index.js";

function row(res) {
    if (!res || !res.length) return undefined;
    const cols = res[0].columns;
    const v = res[0].values[0];
    if (!v) return undefined;
    const o = {};
    cols.forEach((c, i) => (o[c] = v[i]));
    return o;
}

function rows(res) {
    if (!res || !res.length) return [];
    const cols = res[0].columns;
    return res[0].values.map((v) => {
        const o = {};
        cols.forEach((c, i) => (o[c] = v[i]));
        return o;
    });
}

export class PracticeSessionRepository {
    async create(session) {
        const db = await getDb();
        const conceptsJson = session.concepts_json
            ? JSON.stringify(session.concepts_json).replace(/'/g, "''")
            : null;
        db.exec(`INSERT INTO practice_sessions (
            id, user_id, session_type, concepts_json, target_difficulty, 
            questions_total, questions_correct, score_percentage, test_id
        ) VALUES (
            '${session.id}', '${session.user_id}', '${session.session_type}',
            ${conceptsJson ? `'${conceptsJson}'` : "NULL"},
            ${
                session.target_difficulty
                    ? `'${session.target_difficulty}'`
                    : "NULL"
            },
            ${session.questions_total || "NULL"}, ${
            session.questions_correct || "NULL"
        },
            ${session.score_percentage || "NULL"},
            ${session.test_id ? `'${session.test_id}'` : "NULL"}
        )`);
        return this.findById(session.id);
    }

    async findById(id) {
        const db = await getDb();
        return row(
            db.exec(`SELECT * FROM practice_sessions WHERE id='${id}' LIMIT 1`)
        );
    }

    async complete(sessionId, data) {
        const db = await getDb();
        const sets = [];
        if (data.questions_correct !== undefined)
            sets.push(`questions_correct=${data.questions_correct}`);
        if (data.score_percentage !== undefined)
            sets.push(`score_percentage=${data.score_percentage}`);
        if (data.duration_seconds !== undefined)
            sets.push(`duration_seconds=${data.duration_seconds}`);
        sets.push(`completed_at=datetime('now')`);

        db.exec(
            `UPDATE practice_sessions SET ${sets.join(
                ", "
            )} WHERE id='${sessionId}'`
        );
        return this.findById(sessionId);
    }

    async findByUser(userId, limit = 50, offset = 0) {
        const db = await getDb();
        return rows(
            db.exec(`
            SELECT * FROM practice_sessions 
            WHERE user_id='${userId}' AND completed_at IS NOT NULL
            ORDER BY completed_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `)
        );
    }

    async countByUser(userId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT COUNT(*) as count FROM practice_sessions WHERE user_id='${userId}' AND completed_at IS NOT NULL`
        );
        return row(res)?.count || 0;
    }

    async getStreak(userId) {
        const db = await getDb();
        // Get distinct dates of completed sessions
        const sessions = rows(
            db.exec(`
            SELECT DISTINCT date(completed_at) as practice_date 
            FROM practice_sessions 
            WHERE user_id='${userId}' AND completed_at IS NOT NULL
            ORDER BY practice_date DESC
        `)
        );

        if (!sessions.length) return 0;

        let streak = 0;
        const today = new Date().toISOString().split("T")[0];
        let checkDate = today;

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
        const db = await getDb();
        const res = db.exec(`
            SELECT 
                COUNT(*) as session_count,
                AVG(score_percentage) as avg_score,
                SUM(questions_total) as total_questions
            FROM practice_sessions
            WHERE user_id='${userId}' AND completed_at >= datetime('now', '-${days} days')
        `);
        return (
            row(res) || { session_count: 0, avg_score: 0, total_questions: 0 }
        );
    }
}
