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

export class UserAchievementRepository {
    async findByUser(userId) {
        const db = await getDb();
        return rows(
            db.exec(
                `SELECT * FROM user_achievements WHERE user_id='${userId}' ORDER BY earned_at DESC NULLS LAST, created_at DESC`
            )
        );
    }

    async findByUserAndType(userId, achievementType, achievementName) {
        const db = await getDb();
        const safeName = achievementName.replace(/'/g, "''");
        return row(
            db.exec(
                `SELECT * FROM user_achievements WHERE user_id='${userId}' AND achievement_type='${achievementType}' AND achievement_name='${safeName}' LIMIT 1`
            )
        );
    }

    async create(achievement) {
        const db = await getDb();
        const safeName = achievement.achievement_name.replace(/'/g, "''");
        const safeDesc = (achievement.description || "").replace(/'/g, "''");
        db.exec(`INSERT INTO user_achievements (
            id, user_id, achievement_type, achievement_name, description, 
            progress, progress_total, earned_at
        ) VALUES (
            '${achievement.id}', '${achievement.user_id}', '${
            achievement.achievement_type
        }',
            '${safeName}', '${safeDesc}', ${achievement.progress || 0}, ${
            achievement.progress_total || 100
        },
            ${achievement.earned_at ? `'${achievement.earned_at}'` : "NULL"}
        )`);
        return this.findByUserAndType(
            achievement.user_id,
            achievement.achievement_type,
            achievement.achievement_name
        );
    }

    async updateProgress(
        userId,
        achievementType,
        achievementName,
        progress,
        earned = false
    ) {
        const db = await getDb();
        const safeName = achievementName.replace(/'/g, "''");
        const earnedClause = earned ? `, earned_at=datetime('now')` : "";
        db.exec(
            `UPDATE user_achievements SET progress=${progress}${earnedClause} WHERE user_id='${userId}' AND achievement_type='${achievementType}' AND achievement_name='${safeName}'`
        );
        return this.findByUserAndType(userId, achievementType, achievementName);
    }

    async getEarnedCount(userId) {
        const db = await getDb();
        const res = db.exec(
            `SELECT COUNT(*) as count FROM user_achievements WHERE user_id='${userId}' AND earned_at IS NOT NULL`
        );
        return row(res)?.count || 0;
    }
}

export class ConceptRelationshipRepository {
    async findPrerequisites(conceptName) {
        const db = await getDb();
        const safeName = conceptName.replace(/'/g, "''");
        return rows(
            db.exec(
                `SELECT * FROM concept_relationships WHERE concept_name='${safeName}' ORDER BY strength DESC`
            )
        );
    }

    async findRelated(conceptName) {
        const db = await getDb();
        const safeName = conceptName.replace(/'/g, "''");
        return rows(
            db.exec(
                `SELECT * FROM concept_relationships WHERE concept_name='${safeName}' OR prerequisite_name='${safeName}'`
            )
        );
    }

    async create(relationship) {
        const db = await getDb();
        const safeConcept = relationship.concept_name.replace(/'/g, "''");
        const safePrereq = relationship.prerequisite_name.replace(/'/g, "''");
        db.exec(`INSERT OR IGNORE INTO concept_relationships (
            id, concept_name, prerequisite_name, relationship_type, strength
        ) VALUES (
            '${relationship.id}', '${safeConcept}', '${safePrereq}',
            '${relationship.relationship_type || "prerequisite"}', ${
            relationship.strength || 1
        }
        )`);
    }
}
