import { v4 as uuid } from "uuid";
import { logger } from "../config/logger.js";

export class AchievementService {
    /**
     * Achievement definitions
     */
    static ACHIEVEMENTS = {
        streak_7: {
            name: "Week Warrior",
            description: "Practice 7 days in a row",
            total: 7,
            type: "streak",
        },
        streak_30: {
            name: "30-Day Champion",
            description: "Practice 30 days in a row",
            total: 30,
            type: "streak",
        },
        concepts_10: {
            name: "Getting Started",
            description: "Master 10 concepts",
            total: 10,
            type: "concepts_mastered",
        },
        concepts_50: {
            name: "Bookworm",
            description: "Master 50 concepts",
            total: 50,
            type: "concepts_mastered",
        },
        concepts_100: {
            name: "Scholar",
            description: "Master 100 concepts",
            total: 100,
            type: "concepts_mastered",
        },
        perfect_10: {
            name: "Perfectionist",
            description: "Complete 10 perfect sessions",
            total: 10,
            type: "perfect_sessions",
        },
        sessions_50: {
            name: "Dedicated Learner",
            description: "Complete 50 practice sessions",
            total: 50,
            type: "sessions_completed",
        },
    };

    constructor(achievementRepo) {
        this.achievementRepo = achievementRepo;
    }

    /**
     * Check and update achievements after an event
     */
    async checkAchievements(userId, event, data) {
        const earned = [];

        if (event === "session_complete") {
            earned.push(
                ...(await this._checkSessionAchievements(userId, data))
            );
        }

        if (event === "concept_mastered") {
            earned.push(
                ...(await this._checkConceptAchievements(userId, data))
            );
        }

        if (event === "streak_update") {
            earned.push(...(await this._checkStreakAchievements(userId, data)));
        }

        return earned;
    }

    async _checkSessionAchievements(userId, data) {
        const earned = [];
        const { sessionCount, perfectSession } = data;

        // Sessions completed
        if (sessionCount) {
            const achievement = await this._updateAchievement(
                userId,
                "sessions_completed",
                "sessions_50",
                sessionCount
            );
            if (achievement?.earned) earned.push(achievement);
        }

        // Perfect sessions
        if (perfectSession) {
            const perfectCount = data.perfectCount || 1;
            const achievement = await this._updateAchievement(
                userId,
                "perfect_sessions",
                "perfect_10",
                perfectCount
            );
            if (achievement?.earned) earned.push(achievement);
        }

        return earned;
    }

    async _checkConceptAchievements(userId, data) {
        const earned = [];
        const { masteredCount } = data;

        if (!masteredCount) return earned;

        // Check all concept milestones
        for (const [key, def] of Object.entries(
            AchievementService.ACHIEVEMENTS
        )) {
            if (
                def.type === "concepts_mastered" &&
                masteredCount >= def.total
            ) {
                const achievement = await this._updateAchievement(
                    userId,
                    def.type,
                    key,
                    masteredCount
                );
                if (achievement?.earned) earned.push(achievement);
            }
        }

        return earned;
    }

    async _checkStreakAchievements(userId, data) {
        const earned = [];
        const { streak } = data;

        if (!streak) return earned;

        // Check streak milestones
        for (const [key, def] of Object.entries(
            AchievementService.ACHIEVEMENTS
        )) {
            if (def.type === "streak" && streak >= def.total) {
                const achievement = await this._updateAchievement(
                    userId,
                    def.type,
                    key,
                    streak
                );
                if (achievement?.earned) earned.push(achievement);
            }
        }

        return earned;
    }

    async _updateAchievement(userId, type, key, progress) {
        const def = AchievementService.ACHIEVEMENTS[key];
        if (!def) return null;

        let achievement = await this.achievementRepo.findByUserAndType(
            userId,
            type,
            def.name
        );

        if (!achievement) {
            // Create new achievement record
            achievement = await this.achievementRepo.create({
                id: uuid(),
                user_id: userId,
                achievement_type: type,
                achievement_name: def.name,
                description: def.description,
                progress,
                progress_total: def.total,
                earned_at:
                    progress >= def.total ? new Date().toISOString() : null,
            });

            return progress >= def.total
                ? { ...achievement, earned: true }
                : null;
        }

        // Update existing
        if (!achievement.earned_at && progress >= def.total) {
            await this.achievementRepo.updateProgress(
                userId,
                type,
                def.name,
                progress,
                true
            );
            return { ...achievement, earned: true };
        } else if (progress !== achievement.progress) {
            await this.achievementRepo.updateProgress(
                userId,
                type,
                def.name,
                progress,
                false
            );
        }

        return null;
    }

    /**
     * Initialize achievement tracking for a user
     */
    async initializeAchievements(userId) {
        for (const [key, def] of Object.entries(
            AchievementService.ACHIEVEMENTS
        )) {
            const existing = await this.achievementRepo.findByUserAndType(
                userId,
                def.type,
                def.name
            );
            if (!existing) {
                await this.achievementRepo.create({
                    id: uuid(),
                    user_id: userId,
                    achievement_type: def.type,
                    achievement_name: def.name,
                    description: def.description,
                    progress: 0,
                    progress_total: def.total,
                    earned_at: null,
                });
            }
        }
    }

    /**
     * Get achievement progress for UI
     */
    async getAchievementProgress(userId) {
        const achievements = await this.achievementRepo.findByUser(userId);
        const earnedCount = achievements.filter((a) => a.earned_at).length;
        const totalCount = Object.keys(AchievementService.ACHIEVEMENTS).length;

        return {
            earned: achievements.filter((a) => a.earned_at),
            inProgress: achievements.filter(
                (a) => !a.earned_at && a.progress > 0
            ),
            locked: achievements.filter(
                (a) => !a.earned_at && a.progress === 0
            ),
            earnedCount,
            totalCount,
            completionPercentage: Math.round((earnedCount / totalCount) * 100),
        };
    }
}
