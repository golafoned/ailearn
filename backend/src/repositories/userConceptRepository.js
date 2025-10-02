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

export class UserConceptRepository {
    async findByUserAndConcept(userId, conceptName) {
        const db = await getDb();
        const safeName = conceptName.replace(/'/g, "''");
        return row(
            db.exec(
                `SELECT * FROM user_concepts WHERE user_id='${userId}' AND concept_name='${safeName}' LIMIT 1`
            )
        );
    }

    async findByUser(userId, filters = {}) {
        const db = await getDb();
        let where = `user_id='${userId}'`;

        if (filters.masteryMin !== undefined) {
            where += ` AND mastery_level >= ${filters.masteryMin}`;
        }
        if (filters.masteryMax !== undefined) {
            where += ` AND mastery_level <= ${filters.masteryMax}`;
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

        return rows(
            db.exec(
                `SELECT * FROM user_concepts WHERE ${where} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`
            )
        );
    }

    async create(concept) {
        const db = await getDb();
        const safeName = concept.concept_name.replace(/'/g, "''");
        db.exec(`INSERT INTO user_concepts (
            id, user_id, concept_name, mastery_level, total_attempts, correct_attempts,
            last_practiced_at, next_review_due, difficulty_level, consecutive_correct, consecutive_wrong
        ) VALUES (
            '${concept.id}', '${concept.user_id}', '${safeName}', ${
            concept.mastery_level || 0
        },
            ${concept.total_attempts || 0}, ${concept.correct_attempts || 0},
            ${
                concept.last_practiced_at
                    ? `'${concept.last_practiced_at}'`
                    : "NULL"
            },
            ${
                concept.next_review_due
                    ? `'${concept.next_review_due}'`
                    : "NULL"
            },
            '${concept.difficulty_level || "easy"}', ${
            concept.consecutive_correct || 0
        }, ${concept.consecutive_wrong || 0}
        )`);
        return this.findByUserAndConcept(concept.user_id, concept.concept_name);
    }

    async update(userId, conceptName, updates) {
        const db = await getDb();
        const safeName = conceptName.replace(/'/g, "''");
        const sets = [];

        if (updates.mastery_level !== undefined)
            sets.push(`mastery_level=${updates.mastery_level}`);
        if (updates.total_attempts !== undefined)
            sets.push(`total_attempts=${updates.total_attempts}`);
        if (updates.correct_attempts !== undefined)
            sets.push(`correct_attempts=${updates.correct_attempts}`);
        if (updates.last_practiced_at)
            sets.push(`last_practiced_at='${updates.last_practiced_at}'`);
        if (updates.next_review_due)
            sets.push(`next_review_due='${updates.next_review_due}'`);
        if (updates.difficulty_level)
            sets.push(`difficulty_level='${updates.difficulty_level}'`);
        if (updates.consecutive_correct !== undefined)
            sets.push(`consecutive_correct=${updates.consecutive_correct}`);
        if (updates.consecutive_wrong !== undefined)
            sets.push(`consecutive_wrong=${updates.consecutive_wrong}`);
        sets.push(`updated_at=datetime('now')`);

        db.exec(
            `UPDATE user_concepts SET ${sets.join(
                ", "
            )} WHERE user_id='${userId}' AND concept_name='${safeName}'`
        );
        return this.findByUserAndConcept(userId, conceptName);
    }

    async getStats(userId) {
        const db = await getDb();
        const res = db.exec(`
            SELECT 
                COUNT(*) as total_concepts,
                COALESCE(AVG(mastery_level), 0) as avg_mastery,
                SUM(CASE WHEN mastery_level >= 80 THEN 1 ELSE 0 END) as mastered_count,
                SUM(CASE WHEN mastery_level < 40 THEN 1 ELSE 0 END) as weak_count,
                SUM(CASE WHEN next_review_due <= datetime('now') THEN 1 ELSE 0 END) as due_count
            FROM user_concepts WHERE user_id='${userId}'
        `);
        return (
            row(res) || {
                total_concepts: 0,
                avg_mastery: 0,
                mastered_count: 0,
                weak_count: 0,
                due_count: 0,
            }
        );
    }

    async getDueReviews(userId, daysAhead = 1) {
        const db = await getDb();
        return rows(
            db.exec(`
            SELECT * FROM user_concepts 
            WHERE user_id='${userId}' AND next_review_due <= datetime('now', '+${daysAhead} days')
            ORDER BY next_review_due ASC, mastery_level ASC
        `)
        );
    }

    async getWeakConcepts(userId, limit = 10) {
        const db = await getDb();
        return rows(
            db.exec(`
            SELECT * FROM user_concepts 
            WHERE user_id='${userId}' AND mastery_level < 60
            ORDER BY mastery_level ASC, last_practiced_at DESC
            LIMIT ${limit}
        `)
        );
    }
}
