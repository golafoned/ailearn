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

export class TestRepository {
    async create(test) {
        const db = await getDb();
        const jsonParams = JSON.stringify(test.params_json);
        const jsonQuestions = JSON.stringify(test.questions_json);
        db.exec(`INSERT INTO tests (id, code, title, source_filename, source_text, model, params_json, questions_json, expires_at, time_limit_seconds, created_by, is_review, review_source_test_id, review_origin_attempt_ids, review_strategy)
      VALUES ('${test.id}','${test.code}','${test.title.replace(/'/g, "''")}',${
            test.source_filename
                ? `'${test.source_filename.replace(/'/g, "''")}'`
                : "NULL"
        },'${test.source_text.replace(/'/g, "''")}','${
            test.model
        }','${jsonParams.replace(/'/g, "''")}','${jsonQuestions.replace(
            /'/g,
            "''"
        )}','${test.expires_at}',${test.time_limit_seconds},${
            test.created_by ? `'${test.created_by}'` : "NULL"
        },${test.is_review ? 1 : 0},${
            test.review_source_test_id
                ? `'${test.review_source_test_id}'`
                : "NULL"
        },${
            test.review_origin_attempt_ids
                ? `'${JSON.stringify(test.review_origin_attempt_ids).replace(
                      /'/g,
                      "''"
                  )}'`
                : "NULL"
        },${test.review_strategy ? `'${test.review_strategy}'` : "NULL"});`);
        return this.findById(test.id);
    }
    async findByCode(code) {
        const db = await getDb();
        return row(
            db.exec(`SELECT * FROM tests WHERE code='${code}' LIMIT 1;`)
        );
    }
    async findById(id) {
        const db = await getDb();
        return row(db.exec(`SELECT * FROM tests WHERE id='${id}' LIMIT 1;`));
    }
    async listByOwner(userId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM tests WHERE created_by='${userId}' ORDER BY created_at DESC;`
        );
        if (!res.length) return [];
        const cols = res[0].columns;
        return res[0].values.map((v) => {
            const o = {};
            cols.forEach((c, i) => (o[c] = v[i]));
            return o;
        });
    }
    async listByOwnerPaged(userId, { page, pageSize }) {
        const db = await getDb();
        const offset = (page - 1) * pageSize;
        const res = db.exec(
            `SELECT * FROM tests WHERE created_by='${userId}' ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset};`
        );
        const countRes = db.exec(
            `SELECT COUNT(*) as c FROM tests WHERE created_by='${userId}';`
        );
        const total = countRes.length ? countRes[0].values[0][0] : 0;
        if (!res.length) return { items: [], total };
        const cols = res[0].columns;
        const items = res[0].values.map((v) => {
            const o = {};
            cols.forEach((c, i) => (o[c] = v[i]));
            return o;
        });
        return { items, total };
    }
    async createReviewTest(data) {
        return this.create({ ...data, is_review: true });
    }
    async listReviewByUser(userId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM tests WHERE created_by='${userId}' AND is_review=1 ORDER BY created_at DESC;`
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
