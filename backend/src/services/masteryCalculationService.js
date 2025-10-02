export class MasteryCalculationService {
    /**
     * Calculate mastery change based on difficulty and correctness
     * @param {number} currentMastery - Current mastery level (0-100)
     * @param {string} difficulty - Question difficulty (easy, medium, hard)
     * @param {boolean} wasCorrect - Whether answer was correct
     * @returns {number} New mastery level (0-100)
     */
    calculateMasteryChange(currentMastery, difficulty, wasCorrect) {
        const weights = {
            easy: { correct: 4, wrong: -20 },
            medium: { correct: 8, wrong: -15 },
            hard: { correct: 12, wrong: -8 },
        };

        const weight = weights[difficulty] || weights.medium;
        const change = wasCorrect ? weight.correct : weight.wrong;

        return Math.max(0, Math.min(100, currentMastery + change));
    }

    /**
     * Calculate next review date using spaced repetition
     * @param {number} mastery - Current mastery level (0-100)
     * @param {number} consecutiveCorrect - Consecutive correct answers
     * @returns {number} Days until next review
     */
    calculateNextReviewDays(mastery, consecutiveCorrect = 0) {
        if (mastery < 30) return 1; // Review tomorrow
        if (mastery < 50) return 3; // Review in 3 days
        if (mastery < 70) return 7; // Review in a week
        if (mastery < 80) return 14; // Review in 2 weeks
        if (mastery < 90) return 30; // Review in a month
        return 60; // Review in 2 months
    }

    /**
     * Calculate next review date as ISO string
     */
    calculateNextReviewDate(mastery, consecutiveCorrect = 0) {
        const days = this.calculateNextReviewDays(mastery, consecutiveCorrect);
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    /**
     * Determine appropriate difficulty level based on mastery
     * @param {number} mastery - Current mastery level (0-100)
     * @returns {string} Suggested difficulty
     */
    suggestDifficulty(mastery) {
        if (mastery < 30) return "easy";
        if (mastery < 60) return "medium";
        return "hard";
    }

    /**
     * Generate difficulty distribution for adaptive session
     * @param {number} mastery - Current mastery level (0-100)
     * @param {number} totalQuestions - Total questions to generate
     * @returns {Object} Distribution { easy, medium, hard }
     */
    generateDifficultyDistribution(mastery, totalQuestions) {
        let easyPct, mediumPct, hardPct;

        if (mastery < 30) {
            [easyPct, mediumPct, hardPct] = [0.8, 0.2, 0.0];
        } else if (mastery < 60) {
            [easyPct, mediumPct, hardPct] = [0.4, 0.5, 0.1];
        } else if (mastery < 80) {
            [easyPct, mediumPct, hardPct] = [0.2, 0.5, 0.3];
        } else {
            [easyPct, mediumPct, hardPct] = [0.1, 0.2, 0.7];
        }

        return {
            easy: Math.round(totalQuestions * easyPct),
            medium: Math.round(totalQuestions * mediumPct),
            hard: Math.round(totalQuestions * hardPct),
        };
    }

    /**
     * Determine if difficulty should be adjusted based on recent performance
     * @param {Array<boolean>} recentAnswers - Last 3-4 answers
     * @param {string} currentDifficulty - Current difficulty level
     * @returns {Object} { shouldAdjust, newDifficulty, message }
     */
    shouldAdjustDifficulty(recentAnswers, currentDifficulty) {
        if (recentAnswers.length < 3) {
            return {
                shouldAdjust: false,
                newDifficulty: currentDifficulty,
                message: null,
            };
        }

        const last3 = recentAnswers.slice(-3);
        const allCorrect = last3.every((a) => a === true);
        const twoOrMoreWrong = last3.filter((a) => !a).length >= 2;

        if (allCorrect && currentDifficulty !== "hard") {
            const newDiff = currentDifficulty === "easy" ? "medium" : "hard";
            return {
                shouldAdjust: true,
                newDifficulty: newDiff,
                message: `Great! Moving to ${newDiff} difficulty`,
            };
        }

        if (twoOrMoreWrong && currentDifficulty !== "easy") {
            const newDiff = currentDifficulty === "hard" ? "medium" : "easy";
            return {
                shouldAdjust: true,
                newDifficulty: newDiff,
                message: `Let's try ${newDiff} questions to build confidence`,
            };
        }

        return {
            shouldAdjust: false,
            newDifficulty: currentDifficulty,
            message: null,
        };
    }

    /**
     * Calculate overall progress percentage
     * @param {Array} concepts - Array of user concepts
     * @returns {number} Overall progress (0-100)
     */
    calculateOverallProgress(concepts) {
        if (!concepts || concepts.length === 0) return 0;
        const totalMastery = concepts.reduce(
            (sum, c) => sum + (c.mastery_level || 0),
            0
        );
        return Math.round(totalMastery / concepts.length);
    }

    /**
     * Calculate improvement percentage over time
     * @param {number} oldAvg - Old average mastery
     * @param {number} newAvg - New average mastery
     * @returns {number} Improvement percentage
     */
    calculateImprovement(oldAvg, newAvg) {
        if (oldAvg === 0) return newAvg;
        return Math.round(((newAvg - oldAvg) / oldAvg) * 100);
    }
}
