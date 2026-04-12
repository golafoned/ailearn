import { queryOne, queryAll, run } from "../db/index.js";

export class TestAttemptRepository {
    async create(att) {
        const participant = att.participant_name || "Participant";
        await run(
            `INSERT INTO test_attempts (id, test_id, user_id, participant_name, display_name) VALUES (?, ?, ?, ?, ?)`,
            [att.id, att.test_id, att.user_id || null, participant, att.display_name || null]
        );
        return this.findById(att.id);
    }

    async findById(id) {
        return queryOne(`SELECT * FROM test_attempts WHERE id=? LIMIT 1`, [id]);
    }

    async submit(id, answers_json, score) {
        await run(
            `UPDATE test_attempts SET submitted_at=datetime('now'), answers_json=?, score=? WHERE id=?`,
            [JSON.stringify(answers_json), score == null ? null : score, id]
        );
        return this.findById(id);
    }

    async listByTest(testId) {
        return queryAll(
            `SELECT * FROM test_attempts WHERE test_id=? ORDER BY (score IS NULL) ASC, score DESC, started_at ASC`,
            [testId]
        );
    }

    async listByUser(userId) {
        return queryAll(
            `SELECT a.*, t.code as test_code, t.title as test_title FROM test_attempts a LEFT JOIN tests t ON t.id=a.test_id WHERE a.user_id=? ORDER BY a.started_at DESC`,
            [userId]
        );
    }

    async listByTestAndUser(testId, userId) {
        return queryAll(
            `SELECT * FROM test_attempts WHERE test_id=? AND user_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 50`,
            [testId, userId]
        );
    }

    async listWrongAnswersForUser({ userId, limit = 100 }) {
        return queryAll(
            `SELECT taa.* FROM test_attempt_answers taa 
            INNER JOIN test_attempts ta ON ta.id=taa.attempt_id 
            WHERE ta.user_id=? AND taa.is_correct=0 
            ORDER BY ta.submitted_at DESC LIMIT ?`,
            [userId, limit]
        );
    }

    async listByConcept(userId, conceptName, { includeInProgress = true } = {}) {
        const submittedFilter = includeInProgress ? "1=1" : "ta.submitted_at IS NOT NULL";
        return queryAll(
            `SELECT 
                ta.id as attempt_id,
                ta.test_id,
                ta.score,
                ta.submitted_at,
                ta.started_at,
                t.code as test_code,
                t.title as test_title,
                COUNT(taa.id) as answered_count,
                SUM(CASE WHEN taa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count
            FROM test_attempts ta
            INNER JOIN tests t ON t.id = ta.test_id
            LEFT JOIN test_attempt_answers taa ON taa.attempt_id = ta.id
            WHERE ta.user_id=? 
              AND ${submittedFilter}
              AND (
                  (t.concepts_json IS NOT NULL AND t.concepts_json LIKE '%' || ? || '%')
                 OR (t.concepts_json IS NULL AND t.params_json LIKE '%' || ? || '%')
              )
            GROUP BY ta.id, ta.test_id, t.code, t.title, ta.score, ta.submitted_at, ta.started_at
            ORDER BY COALESCE(ta.submitted_at, ta.started_at) DESC`,
            [userId, conceptName, conceptName]
        ).then(rows => rows.map(o => ({ ...o, status: o.submitted_at ? "completed" : "in_progress" })));
    }
}

export class AttemptAnswersRepository {
    async bulkInsert(attemptId, answers) {
        if (!answers?.length) return;
        for (const a of answers) {
            await run(
                `INSERT INTO test_attempt_answers (id, attempt_id, question_id, question_text, correct_answer, user_answer, is_correct) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [a.id, attemptId, a.question_id, a.question_text, a.correct_answer || "", a.user_answer || "", a.is_correct ? 1 : 0]
            );
        }
    }

    async listForAttempt(attemptId) {
        return queryAll(
            `SELECT * FROM test_attempt_answers WHERE attempt_id=? ORDER BY id`,
            [attemptId]
        );
    }
}
