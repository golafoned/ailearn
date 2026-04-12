import { queryOne, queryAll, run } from "../db/index.js";

export class UserAchievementRepository {
    async findByUser(userId) {
        return queryAll(
            `SELECT * FROM user_achievements WHERE user_id=? ORDER BY earned_at DESC NULLS LAST, created_at DESC`,
            [userId]
        );
    }

    async findByUserAndType(userId, achievementType, achievementName) {
        return queryOne(
            `SELECT * FROM user_achievements WHERE user_id=? AND achievement_type=? AND achievement_name=? LIMIT 1`,
            [userId, achievementType, achievementName]
        );
    }

    async create(achievement) {
        await run(`INSERT INTO user_achievements (
            id, user_id, achievement_type, achievement_name, description, 
            progress, progress_total, earned_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            achievement.id,
            achievement.user_id,
            achievement.achievement_type,
            achievement.achievement_name,
            achievement.description || "",
            achievement.progress || 0,
            achievement.progress_total || 100,
            achievement.earned_at || null,
        ]);
        return this.findByUserAndType(
            achievement.user_id,
            achievement.achievement_type,
            achievement.achievement_name
        );
    }

    async updateProgress(userId, achievementType, achievementName, progress, earned = false) {
        const earnedClause = earned ? `, earned_at=datetime('now')` : "";
        await run(
            `UPDATE user_achievements SET progress=?${earnedClause} WHERE user_id=? AND achievement_type=? AND achievement_name=?`,
            [progress, userId, achievementType, achievementName]
        );
        return this.findByUserAndType(userId, achievementType, achievementName);
    }

    async getEarnedCount(userId) {
        const row = await queryOne(
            `SELECT COUNT(*) as count FROM user_achievements WHERE user_id=? AND earned_at IS NOT NULL`,
            [userId]
        );
        return row?.count || 0;
    }
}

export class ConceptRelationshipRepository {
    async findPrerequisites(conceptName) {
        return queryAll(
            `SELECT * FROM concept_relationships WHERE concept_name=? ORDER BY strength DESC`,
            [conceptName]
        );
    }

    async findRelated(conceptName) {
        return queryAll(
            `SELECT * FROM concept_relationships WHERE concept_name=? OR prerequisite_name=?`,
            [conceptName, conceptName]
        );
    }

    async create(relationship) {
        await run(`INSERT OR IGNORE INTO concept_relationships (
            id, concept_name, prerequisite_name, relationship_type, strength
        ) VALUES (?, ?, ?, ?, ?)`, [
            relationship.id,
            relationship.concept_name,
            relationship.prerequisite_name,
            relationship.relationship_type || "prerequisite",
            relationship.strength || 1,
        ]);
    }
}
