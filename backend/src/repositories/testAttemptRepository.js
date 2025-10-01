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

export class TestAttemptRepository {
    async create(att) {
        const db = await getDb();
        const participant = (att.participant_name || 'Participant').replace(/'/g, "''");
        const displayName = att.display_name
            ? `'${att.display_name.replace(/'/g, "''")}'`
            : "NULL";
        db.exec(`INSERT INTO test_attempts (id, test_id, user_id, participant_name, display_name) VALUES ('${att.id}','${att.test_id}',${att.user_id ? `'${att.user_id}'` : "NULL"},'${participant}',${displayName});`);
        return this.findById(att.id);
    }
    async findById(id) {
        const db = await getDb();
        return row(
            db.exec(`SELECT * FROM test_attempts WHERE id='${id}' LIMIT 1;`)
        );
    }
    async submit(id, answers_json, score) {
        const db = await getDb();
        const answers = JSON.stringify(answers_json).replace(/'/g, "''");
        db.exec(
            `UPDATE test_attempts SET submitted_at=datetime('now'), answers_json='${answers}', score=${
                score == null ? "NULL" : score
            } WHERE id='${id}';`
        );
        return this.findById(id);
    }
    async listByTest(testId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM test_attempts WHERE test_id='${testId}' ORDER BY started_at ASC;`
        );
        if (!res.length) return [];
        const cols = res[0].columns;
        return res[0].values.map((v) => {
            const o = {};
            cols.forEach((c, i) => (o[c] = v[i]));
            return o;
        });
    }
    async listByUser(userId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM test_attempts WHERE user_id='${userId}' ORDER BY started_at DESC;`
        );
        if (!res.length) return [];
        const cols = res[0].columns;
        return res[0].values.map((v) => {
            const o = {};
            cols.forEach((c, i) => (o[c] = v[i]));
            return o;
        });
    }
}

export class AttemptAnswersRepository {
    async bulkInsert(attemptId, answers) {
        if (!answers?.length) return;
        const db = await getDb();
        const values = answers
            .map(
                (a) =>
                    `('${a.id}','${attemptId}','${
                        a.question_id
                    }','${a.question_text.replace(/'/g, "''")}','${
                        a.correct_answer?.replace(/'/g, "''") || ""
                    }','${a.user_answer?.replace(/'/g, "''") || ""}',${
                        a.is_correct ? 1 : 0
                    })`
            )
            .join(",");
        db.exec(
            `INSERT INTO test_attempt_answers (id, attempt_id, question_id, question_text, correct_answer, user_answer, is_correct) VALUES ${values};`
        );
    }
    async listForAttempt(attemptId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM test_attempt_answers WHERE attempt_id='${attemptId}' ORDER BY id;`
        );
        if (!res.length) return [];
        const cols = res[0].columns;
        return res[0].values.map((v) => {
            const o = {};
            cols.forEach((c, i) => (o[c] = v[i]));
            return o;
        });
    }
}
