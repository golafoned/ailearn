import { v4 as uuid } from "uuid";
import { TestGenerationService } from "./testGenerationService.js";
import { ConceptExtractionService } from "./conceptExtractionService.js";
import { MasteryCalculationService } from "./masteryCalculationService.js";
import { logger } from "../config/logger.js";

export class AdaptiveQuestionService {
    constructor() {
        this.generationService = new TestGenerationService();
        this.conceptService = new ConceptExtractionService();
        this.masteryService = new MasteryCalculationService();
    }

    /**
     * Generate adaptive questions based on concepts and mastery
     */
    async generateQuestions(concepts, masteryLevels, questionCount, userId) {
        // Build concept-focused source text
        const pseudoSource = this._buildPseudoSource(concepts, masteryLevels);

        // Calculate average mastery to determine difficulty distribution
        const avgMastery = this._calculateAvgMastery(concepts, masteryLevels);
        const distribution = this.masteryService.generateDifficultyDistribution(
            avgMastery,
            questionCount
        );

        // Generate questions with difficulty hints
        const difficultyHint = this._buildDifficultyHint(distribution);
        const extraInstructions = `Focus on: ${concepts.join(
            ", "
        )}. ${difficultyHint}`;

        try {
            const questions = await this._generateWithDifficulty(
                pseudoSource,
                concepts[0] || "General",
                questionCount,
                distribution,
                extraInstructions
            );

            // Enrich questions with concept tags
            return await this._enrichQuestions(questions, concepts);
        } catch (error) {
            logger.error(
                { error, concepts },
                "Adaptive question generation failed"
            );
            // Fallback to simple generation
            return this._generateFallbackQuestions(
                concepts,
                questionCount,
                distribution
            );
        }
    }

    /**
     * Select questions from item bank based on mastery
     */
    selectFromBank(availableQuestions, mastery, count) {
        const suggestedDiff = this.masteryService.suggestDifficulty(mastery);

        // Filter by difficulty preference
        let filtered = availableQuestions.filter(
            (q) => q.difficulty === suggestedDiff || !q.difficulty
        );

        // If not enough, mix with adjacent difficulties
        if (filtered.length < count) {
            filtered = availableQuestions;
        }

        // Shuffle and take requested count
        return this._shuffle(filtered).slice(0, count);
    }

    /**
     * Adjust difficulty mid-session
     */
    adjustDifficulty(recentAnswers, currentDifficulty, availableQuestions) {
        const adjustment = this.masteryService.shouldAdjustDifficulty(
            recentAnswers,
            currentDifficulty
        );

        if (!adjustment.shouldAdjust) {
            return { adjusted: false, questions: [], message: null };
        }

        // Find questions of new difficulty
        const newQuestions = availableQuestions.filter(
            (q) => q.difficulty === adjustment.newDifficulty
        );

        return {
            adjusted: true,
            newDifficulty: adjustment.newDifficulty,
            questions: this._shuffle(newQuestions).slice(0, 3), // Get 3 questions of new difficulty
            message: adjustment.message,
        };
    }

    _buildPseudoSource(concepts, masteryLevels) {
        // Build a pseudo-source text focusing on the concepts
        const conceptDescriptions = concepts.map((concept, i) => {
            const mastery = masteryLevels[concept] || 0;
            const detail =
                mastery < 40
                    ? "fundamental principles"
                    : "advanced applications";
            return `${concept}: Important topic covering ${detail}. Key concept for understanding.`;
        });
        return conceptDescriptions.join(" ");
    }

    _calculateAvgMastery(concepts, masteryLevels) {
        const total = concepts.reduce(
            (sum, c) => sum + (masteryLevels[c] || 0),
            0
        );
        return concepts.length > 0 ? total / concepts.length : 50;
    }

    _buildDifficultyHint(distribution) {
        const parts = [];
        if (distribution.easy > 0) parts.push(`${distribution.easy} easy`);
        if (distribution.medium > 0)
            parts.push(`${distribution.medium} medium`);
        if (distribution.hard > 0) parts.push(`${distribution.hard} hard`);
        return `Generate ${parts.join(", ")} difficulty questions.`;
    }

    async _generateWithDifficulty(
        source,
        title,
        count,
        distribution,
        extraInstructions
    ) {
        // For now, use existing generation service
        // In production, would make multiple calls for each difficulty
        const result = await this.generationService.generateFromText({
            sourceText: source,
            title,
            questionCount: count,
            difficulty: "medium",
            timeLimitSeconds: count * 60,
            expiresInMinutes: 60,
            extraInstructions,
            params: { adaptive: true, distribution },
            createdBy: null,
        });

        return JSON.parse(result.questions_json);
    }

    async _enrichQuestions(questions, concepts) {
        const enriched = [];
        for (const q of questions) {
            const conceptTags = concepts.length > 0 ? concepts : ["General"];
            const difficulty =
                q.difficulty ||
                this.conceptService.estimateDifficulty(
                    q.question,
                    q.options?.length
                );
            const estimatedSeconds = this.conceptService.estimateTime(
                difficulty,
                q.type
            );

            enriched.push({
                ...q,
                conceptTags,
                difficulty,
                estimatedSeconds,
                conceptCategory: concepts[0] || "General",
            });
        }
        return enriched;
    }

    _generateFallbackQuestions(concepts, count, distribution) {
        const questions = [];
        for (let i = 0; i < count; i++) {
            const difficulty = this._selectDifficultyByDistribution(
                i,
                count,
                distribution
            );
            questions.push({
                id: uuid(),
                type: "mcq",
                question: `Question about ${
                    concepts[0] || "topic"
                } (${difficulty})?`,
                options: ["A", "B", "C", "D"],
                answer: "A",
                difficulty,
                explanation: `This ${difficulty} question tests understanding of ${
                    concepts[0] || "the concept"
                }.`,
                reference: null,
                conceptTags: concepts,
                estimatedSeconds:
                    difficulty === "easy"
                        ? 30
                        : difficulty === "medium"
                        ? 60
                        : 90,
            });
        }
        return questions;
    }

    _selectDifficultyByDistribution(index, total, distribution) {
        if (index < distribution.easy) return "easy";
        if (index < distribution.easy + distribution.medium) return "medium";
        return "hard";
    }

    _shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
