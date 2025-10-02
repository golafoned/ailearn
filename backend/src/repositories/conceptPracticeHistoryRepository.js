import { getDb } from "../db/index.js";

function rows(res) {
    if (!res || !res.length) return [];
    const cols = res[0].columns;
    return res[0].values.map((v) => {
        const o = {};
        cols.forEach((c, i) => (o[c] = v[i]));
        return o;
    });
}

export class ConceptPracticeHistoryRepository {
    async create(record) {
        const db = await getDb();
        const safeName = record.concept_name.replace(/'/g, "''");
        db.exec(`INSERT INTO concept_practice_history (
            id, user_id, concept_name, session_id, question_difficulty, was_correct,
            mastery_before, mastery_after, time_spent_seconds
        ) VALUES (
            '${record.id}', '${record.user_id}', '${safeName}',
            ${record.session_id ? `'${record.session_id}'` : "NULL"},
            ${
                record.question_difficulty
                    ? `'${record.question_difficulty}'`
                    : "NULL"
            },
            ${record.was_correct ? 1 : 0},
            ${record.mastery_before || "NULL"}, ${
            record.mastery_after || "NULL"
        },
            ${record.time_spent_seconds || "NULL"}
        )`);
    }

    async findByUserAndConcept(userId, conceptName, limit = 50) {
        const db = await getDb();
        const safeName = conceptName.replace(/'/g, "''");
        return rows(
            db.exec(`
            SELECT * FROM concept_practice_history 
            WHERE user_id='${userId}' AND concept_name='${safeName}'
            ORDER BY created_at DESC LIMIT ${limit}
        `)
        );
    }

    async findBySession(sessionId) {
        const db = await getDb();
        return rows(
            db.exec(
                `SELECT * FROM concept_practice_history WHERE session_id='${sessionId}' ORDER BY created_at ASC`
            )
        );
    }

    async getProgressChart(userId, period = "month") {
        const db = await getDb();
        let dateFormat = "date(created_at)";
        if (period === "week") dateFormat = "date(created_at)";
        if (period === "month")
            dateFormat = "date(created_at, 'start of month')";
        if (period === "quarter")
            dateFormat =
                "date(created_at, 'start of month', '-' || (strftime('%m', created_at) % 3) || ' months')";

        return rows(
            db.exec(`
            SELECT 
                ${dateFormat} as date,
                AVG(mastery_after) as avg_mastery,
                COUNT(DISTINCT concept_name) as concepts_practiced,
                SUM(was_correct) as correct_count,
                COUNT(*) as total_attempts
            FROM concept_practice_history
            WHERE user_id='${userId}' AND mastery_after IS NOT NULL
            GROUP BY ${dateFormat}
            ORDER BY date ASC
        `)
        );
    }

    async getRecentWrongAnswers(userId, limit = 100) {
        const db = await getDb();
        return rows(
            db.exec(`
            SELECT * FROM concept_practice_history 
            WHERE user_id='${userId}' AND was_correct=0
            ORDER BY created_at DESC LIMIT ${limit}
        `)
        );
    }
}
