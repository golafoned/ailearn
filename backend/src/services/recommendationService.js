import { logger } from "../config/logger.js";

export class RecommendationService {
    /**
     * Generate personalized recommendations based on user performance
     */
    async getPersonalizedRecommendations(
        userId,
        userConcepts,
        practiceHistory
    ) {
        const recommendations = [];

        // Priority 1: Overdue reviews (high priority)
        const overdueRecommendations =
            this._getOverdueRecommendations(userConcepts);
        recommendations.push(...overdueRecommendations);

        // Priority 2: Weak concepts (high priority)
        const weakRecommendations =
            this._getWeakConceptRecommendations(userConcepts);
        recommendations.push(...weakRecommendations);

        // Priority 3: Declining performance
        const decliningRecommendations = this._getDecliningRecommendations(
            practiceHistory,
            userConcepts
        );
        recommendations.push(...decliningRecommendations);

        // Priority 4: Practice related concepts (medium priority)
        const relatedRecommendations =
            this._getRelatedConceptRecommendations(userConcepts);
        recommendations.push(...relatedRecommendations);

        // Priority 5: Advanced topics (low priority)
        const advancedRecommendations =
            this._getAdvancedRecommendations(userConcepts);
        recommendations.push(...advancedRecommendations);

        // Sort by priority and return top recommendations
        return recommendations
            .sort(
                (a, b) => this._getPriorityScore(b) - this._getPriorityScore(a)
            )
            .slice(0, 10);
    }

    _getOverdueRecommendations(concepts) {
        const overdue = concepts.filter((c) => {
            if (!c.next_review_due) return false;
            return new Date(c.next_review_due) < new Date();
        });

        return overdue.map((c) => ({
            type: "overdue_review",
            priority: "high",
            conceptName: c.concept_name,
            mastery: c.mastery_level,
            reason: "Due for spaced repetition review",
            action: "Review to maintain mastery",
            daysOverdue: this._calculateDaysOverdue(c.next_review_due),
            sessionType: "quick",
        }));
    }

    _getWeakConceptRecommendations(concepts) {
        const weak = concepts.filter((c) => c.mastery_level < 40);

        return weak.map((c) => ({
            type: "weak_concept",
            priority: "high",
            conceptName: c.concept_name,
            mastery: c.mastery_level,
            reason: "Low mastery - needs focused practice",
            action: "Start with fundamentals",
            attempts: c.total_attempts,
            sessionType: "focused",
        }));
    }

    _getDecliningRecommendations(history, concepts) {
        // Group history by concept and check for declining trends
        const conceptHistory = this._groupHistoryByConcept(history);
        const declining = [];

        for (const [conceptName, records] of Object.entries(conceptHistory)) {
            if (records.length < 3) continue;

            const recent = records.slice(-3);
            const masteryTrend = recent.map((r) => r.mastery_after);

            // Check if mastery is declining
            if (this._isDeclining(masteryTrend)) {
                const concept = concepts.find(
                    (c) => c.concept_name === conceptName
                );
                declining.push({
                    type: "declining",
                    priority: "medium",
                    conceptName,
                    mastery: concept?.mastery_level || 0,
                    reason: "Performance declining in recent sessions",
                    action: "Review fundamentals to prevent further decline",
                    sessionType: "focused",
                });
            }
        }

        return declining;
    }

    _getRelatedConceptRecommendations(concepts) {
        // Suggest concepts related to recently practiced ones
        const recentlyPracticed = concepts
            .filter((c) => c.last_practiced_at)
            .sort(
                (a, b) =>
                    new Date(b.last_practiced_at) -
                    new Date(a.last_practiced_at)
            )
            .slice(0, 3);

        const related = [];
        for (const c of recentlyPracticed) {
            // Simple heuristic: concepts in same category (if we had category field)
            // For now, suggest mixing with other mid-mastery concepts
            const similar = concepts.filter(
                (other) =>
                    other.concept_name !== c.concept_name &&
                    Math.abs(other.mastery_level - c.mastery_level) < 20 &&
                    other.mastery_level > 40 &&
                    other.mastery_level < 80
            );

            if (similar.length > 0) {
                related.push({
                    type: "related",
                    priority: "medium",
                    conceptName: similar[0].concept_name,
                    mastery: similar[0].mastery_level,
                    reason: `Related to ${c.concept_name} (recently practiced)`,
                    action: "Practice together for better retention",
                    sessionType: "focused",
                });
            }
        }

        return related.slice(0, 2);
    }

    _getAdvancedRecommendations(concepts) {
        // Suggest advanced topics when prerequisites are mastered
        const mastered = concepts.filter((c) => c.mastery_level >= 80);

        if (mastered.length >= 3) {
            return [
                {
                    type: "advanced",
                    priority: "low",
                    conceptName: "Advanced Topics",
                    mastery: 0,
                    reason: `You've mastered ${mastered.length} concepts - ready for challenges!`,
                    action: "Try harder difficulty questions",
                    sessionType: "mastery",
                },
            ];
        }

        return [];
    }

    _groupHistoryByConcept(history) {
        const grouped = {};
        for (const record of history) {
            if (!grouped[record.concept_name]) {
                grouped[record.concept_name] = [];
            }
            grouped[record.concept_name].push(record);
        }
        return grouped;
    }

    _isDeclining(masteryValues) {
        if (masteryValues.length < 2) return false;
        for (let i = 1; i < masteryValues.length; i++) {
            if (masteryValues[i] >= masteryValues[i - 1]) return false;
        }
        return true;
    }

    _calculateDaysOverdue(dueDate) {
        const due = new Date(dueDate);
        const now = new Date();
        const diff = now - due;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    _getPriorityScore(recommendation) {
        const priorityScores = { high: 100, medium: 50, low: 10 };
        return priorityScores[recommendation.priority] || 0;
    }

    /**
     * Generate study path recommendations
     */
    generateStudyPath(concepts, targetConcepts = []) {
        // Simple path: order by mastery, focus on weak -> medium -> strong
        const weak = concepts.filter((c) => c.mastery_level < 40);
        const medium = concepts.filter(
            (c) => c.mastery_level >= 40 && c.mastery_level < 70
        );
        const strong = concepts.filter((c) => c.mastery_level >= 70);

        return {
            phase1: {
                name: "Foundation Building",
                concepts: weak.map((c) => c.concept_name),
                estimatedWeeks: Math.ceil(weak.length / 5),
            },
            phase2: {
                name: "Skill Development",
                concepts: medium.map((c) => c.concept_name),
                estimatedWeeks: Math.ceil(medium.length / 5),
            },
            phase3: {
                name: "Mastery",
                concepts: strong.map((c) => c.concept_name),
                estimatedWeeks: Math.ceil(strong.length / 5),
            },
        };
    }
}
