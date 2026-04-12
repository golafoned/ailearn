import { queryAll, run } from "../db/index.js";

export class ConceptPracticeHistoryRepository {
    async create(record) {
        await run(`INSERT INTO concept_practice_history (
            id, user_id, concept_name, session_id, question_difficulty, was_correct,
            mastery_before, mastery_after, time_spent_seconds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            record.id,
            record.user_id,
            record.concept_name,
            record.session_id || null,
            record.question_difficulty || null,
            record.was_correct ? 1 : 0,
            record.mastery_before ?? null,
            record.mastery_after ?? null,
            record.time_spent_seconds || null,
        ]);
    }

    async findByUserAndConcept(userId, conceptName, limit = 50) {
        return queryAll(`
            SELECT * FROM concept_practice_history 
            WHERE user_id=? AND concept_name=?
            ORDER BY created_at DESC LIMIT ?
        `, [userId, conceptName, limit]);
    }

    async findBySession(sessionId) {
        return queryAll(
            `SELECT * FROM concept_practice_history WHERE session_id=? ORDER BY created_at ASC`,
            [sessionId]
        );
    }

    async getProgressChart(userId, period = "month") {
        let dateFormat = "date(created_at)";
        if (period === "month") dateFormat = "date(created_at, 'start of month')";
        if (period === "quarter")
            dateFormat = "date(created_at, 'start of month', '-' || (strftime('%m', created_at) % 3) || ' months')";

        return queryAll(`
            SELECT 
                ${dateFormat} as date,
                AVG(mastery_after) as avg_mastery,
                COUNT(DISTINCT concept_name) as concepts_practiced,
                SUM(was_correct) as correct_count,
                COUNT(*) as total_attempts
            FROM concept_practice_history
            WHERE user_id=? AND mastery_after IS NOT NULL
            GROUP BY ${dateFormat}
            ORDER BY date ASC
        `, [userId]);
    }

    async getRecentWrongAnswers(userId, limit = 100) {
        return queryAll(`
            SELECT * FROM concept_practice_history 
            WHERE user_id=? AND was_correct=0
            ORDER BY created_at DESC LIMIT ?
        `, [userId, limit]);
    }
}
