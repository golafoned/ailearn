import { v4 as uuid } from "uuid";
import { logger } from "../config/logger.js";

export class AchievementService {
    /**
     * Achievement definitions — 17 total across 4 categories
     */
    static ACHIEVEMENTS = {
        // Streak achievements
        streak_3: {
            name: "Getting Started",
            description: "Practice 3 days in a row",
            total: 3,
            type: "streak",
            icon: "🔥",
            category: "streaks",
        },
        streak_7: {
            name: "Week Warrior",
            description: "Practice 7 days in a row",
            total: 7,
            type: "streak",
            icon: "🔥",
            category: "streaks",
        },
        streak_14: {
            name: "Two-Week Streak",
            description: "Practice 14 days in a row",
            total: 14,
            type: "streak",
            icon: "🔥",
            category: "streaks",
        },
        streak_30: {
            name: "Monthly Master",
            description: "Practice 30 days in a row",
            total: 30,
            type: "streak",
            icon: "🔥",
            category: "streaks",
        },

        // Concept mastery achievements
        concepts_5: {
            name: "First Steps",
            description: "Master 5 concepts (≥80% mastery)",
            total: 5,
            type: "concepts_mastered",
            icon: "📚",
            category: "mastery",
        },
        concepts_10: {
            name: "Knowledge Builder",
            description: "Master 10 concepts",
            total: 10,
            type: "concepts_mastered",
            icon: "📚",
            category: "mastery",
        },
        concepts_25: {
            name: "Subject Expert",
            description: "Master 25 concepts",
            total: 25,
            type: "concepts_mastered",
            icon: "📚",
            category: "mastery",
        },
        concepts_50: {
            name: "Walking Encyclopedia",
            description: "Master 50 concepts",
            total: 50,
            type: "concepts_mastered",
            icon: "📚",
            category: "mastery",
        },

        // Session milestones
        sessions_5: {
            name: "Getting Warmed Up",
            description: "Complete 5 practice sessions",
            total: 5,
            type: "sessions_completed",
            icon: "🎯",
            category: "sessions",
        },
        sessions_25: {
            name: "Dedicated Learner",
            description: "Complete 25 practice sessions",
            total: 25,
            type: "sessions_completed",
            icon: "🎯",
            category: "sessions",
        },
        sessions_50: {
            name: "Practice Makes Perfect",
            description: "Complete 50 practice sessions",
            total: 50,
            type: "sessions_completed",
            icon: "🎯",
            category: "sessions",
        },
        sessions_100: {
            name: "Centurion",
            description: "Complete 100 practice sessions",
            total: 100,
            type: "sessions_completed",
            icon: "🎯",
            category: "sessions",
        },

        // Perfect scores
        perfect_1: {
            name: "First Perfect",
            description: "Get your first 100% score",
            total: 1,
            type: "perfect_sessions",
            icon: "💯",
            category: "perfect_scores",
        },
        perfect_5: {
            name: "Sharpshooter",
            description: "Get 5 perfect scores",
            total: 5,
            type: "perfect_sessions",
            icon: "💯",
            category: "perfect_scores",
        },
        perfect_10: {
            name: "Perfectionist",
            description: "Get 10 perfect scores",
            total: 10,
            type: "perfect_sessions",
            icon: "💯",
            category: "perfect_scores",
        },

        // Flashcard achievements
        cards_created_25: {
            name: "Card Crafter",
            description: "Create 25 flashcards",
            total: 25,
            type: "flashcard_cards",
            icon: "🃏",
            category: "flashcards",
        },
        cards_studied_100: {
            name: "Card Scholar",
            description: "Study 100 flashcards",
            total: 100,
            type: "flashcard_reviews",
            icon: "🃏",
            category: "flashcards",
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
                ...(await this._checkSessionAchievements(userId, data)),
            );
        }

        if (event === "concept_mastered") {
            earned.push(
                ...(await this._checkConceptAchievements(userId, data)),
            );
        }

        if (event === "streak_update") {
            earned.push(...(await this._checkStreakAchievements(userId, data)));
        }

        if (event === "flashcard_card_created") {
            earned.push(...(await this._checkFlashcardCreated(userId, data)));
        }

        if (event === "flashcard_reviewed") {
            earned.push(...(await this._checkFlashcardReviewed(userId, data)));
        }

        return earned;
    }

    async _checkSessionAchievements(userId, data) {
        const earned = [];
        const { sessionCount, perfectSession, perfectCount } = data;

        // Sessions completed milestones
        if (sessionCount) {
            for (const [key, def] of Object.entries(
                AchievementService.ACHIEVEMENTS,
            )) {
                if (def.type === "sessions_completed") {
                    const achievement = await this._updateAchievement(
                        userId,
                        def.type,
                        key,
                        sessionCount,
                    );
                    if (achievement?.earned) earned.push(achievement);
                }
            }
        }

        // Perfect sessions milestones
        if (perfectSession && perfectCount) {
            for (const [key, def] of Object.entries(
                AchievementService.ACHIEVEMENTS,
            )) {
                if (def.type === "perfect_sessions") {
                    const achievement = await this._updateAchievement(
                        userId,
                        def.type,
                        key,
                        perfectCount,
                    );
                    if (achievement?.earned) earned.push(achievement);
                }
            }
        }

        return earned;
    }

    async _checkConceptAchievements(userId, data) {
        const earned = [];
        const { masteredCount } = data;

        if (!masteredCount) return earned;

        for (const [key, def] of Object.entries(
            AchievementService.ACHIEVEMENTS,
        )) {
            if (def.type === "concepts_mastered") {
                const achievement = await this._updateAchievement(
                    userId,
                    def.type,
                    key,
                    masteredCount,
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

        for (const [key, def] of Object.entries(
            AchievementService.ACHIEVEMENTS,
        )) {
            if (def.type === "streak") {
                const achievement = await this._updateAchievement(
                    userId,
                    def.type,
                    key,
                    streak,
                );
                if (achievement?.earned) earned.push(achievement);
            }
        }

        return earned;
    }

    async _checkFlashcardCreated(userId, data) {
        const earned = [];
        const { totalCards } = data;
        if (!totalCards) return earned;

        const achievement = await this._updateAchievement(
            userId,
            "flashcard_cards",
            "cards_created_25",
            totalCards,
        );
        if (achievement?.earned) earned.push(achievement);

        return earned;
    }

    async _checkFlashcardReviewed(userId, data) {
        const earned = [];
        const { totalReviews } = data;
        if (!totalReviews) return earned;

        const achievement = await this._updateAchievement(
            userId,
            "flashcard_reviews",
            "cards_studied_100",
            totalReviews,
        );
        if (achievement?.earned) earned.push(achievement);

        return earned;
    }

    async _updateAchievement(userId, type, key, progress) {
        const def = AchievementService.ACHIEVEMENTS[key];
        if (!def) return null;

        let achievement = await this.achievementRepo.findByUserAndType(
            userId,
            type,
            def.name,
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

        // Already earned — skip
        if (achievement.earned_at) return null;

        // Update progress
        if (progress >= def.total) {
            await this.achievementRepo.updateProgress(
                userId,
                type,
                def.name,
                progress,
                true,
            );
            return { ...achievement, progress, earned: true };
        } else if (progress !== achievement.progress) {
            await this.achievementRepo.updateProgress(
                userId,
                type,
                def.name,
                progress,
                false,
            );
        }

        return null;
    }

    /**
     * Initialize all achievement tracking for a new user
     */
    async initializeAchievements(userId) {
        for (const [key, def] of Object.entries(
            AchievementService.ACHIEVEMENTS,
        )) {
            const existing = await this.achievementRepo.findByUserAndType(
                userId,
                def.type,
                def.name,
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
                (a) => !a.earned_at && a.progress > 0,
            ),
            locked: achievements.filter(
                (a) => !a.earned_at && a.progress === 0,
            ),
            earnedCount,
            totalCount,
            completionPercentage: Math.round((earnedCount / totalCount) * 100),
        };
    }
}
