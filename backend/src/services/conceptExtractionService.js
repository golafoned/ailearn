import { logger } from "../config/logger.js";

export class ConceptExtractionService {
    /**
     * Extract concepts from question text using AI or keyword matching
     * @param {string} questionText - The question text
     * @param {string} answer - The correct answer
     * @param {string} category - Optional category hint
     * @returns {Array<Object>} Array of concepts with confidence scores
     */
    async extractFromQuestion(questionText, answer, category = null) {
        // For now, use keyword-based extraction (can be enhanced with AI later)
        const concepts = [];

        // Common domain keywords and their categories
        const domainKeywords = {
            "Biology > Cell Biology": [
                "cell",
                "mitochondria",
                "ribosome",
                "nucleus",
                "organelle",
                "membrane",
                "cytoplasm",
            ],
            "Biology > Genetics": [
                "dna",
                "rna",
                "gene",
                "chromosome",
                "inheritance",
                "mutation",
                "allele",
            ],
            "Biology > Ecology": [
                "ecosystem",
                "species",
                "population",
                "habitat",
                "biodiversity",
            ],
            "Chemistry > Atoms": [
                "atom",
                "electron",
                "proton",
                "neutron",
                "element",
                "periodic",
            ],
            "Chemistry > Bonds": [
                "bond",
                "ionic",
                "covalent",
                "molecule",
                "compound",
            ],
            "Physics > Motion": [
                "velocity",
                "acceleration",
                "force",
                "momentum",
                "friction",
            ],
            "Physics > Energy": [
                "energy",
                "kinetic",
                "potential",
                "work",
                "power",
            ],
            "Mathematics > Algebra": [
                "equation",
                "variable",
                "solve",
                "linear",
                "quadratic",
            ],
            "Mathematics > Geometry": [
                "angle",
                "triangle",
                "circle",
                "area",
                "perimeter",
                "volume",
            ],
        };

        const lowerQuestion = questionText.toLowerCase();
        const lowerAnswer = (answer || "").toLowerCase();
        const combinedText = lowerQuestion + " " + lowerAnswer;

        // Extract concepts based on keyword matching
        for (const [cat, keywords] of Object.entries(domainKeywords)) {
            for (const keyword of keywords) {
                if (combinedText.includes(keyword)) {
                    // Count occurrences for confidence
                    const count = (
                        combinedText.match(new RegExp(keyword, "g")) || []
                    ).length;
                    const confidence = Math.min(100, count * 30); // Higher count = higher confidence

                    concepts.push({
                        name: this._capitalizeWords(keyword),
                        category: category || cat,
                        confidence,
                        source: "keyword",
                    });
                }
            }
        }

        // Remove duplicates and sort by confidence
        const uniqueConcepts = this._deduplicateConcepts(concepts);
        return uniqueConcepts.slice(0, 5); // Return top 5
    }

    /**
     * Extract concepts from wrong answer for review generation
     * @param {Object} wrongAnswer - Answer record with question_text
     * @returns {Array<string>} Array of concept names
     */
    extractFromWrongAnswer(wrongAnswer) {
        const questionText = wrongAnswer.question_text || "";
        // Simple extraction - can be enhanced
        const words = questionText
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 4);

        // Return unique important words (simple heuristic)
        return [...new Set(words)].slice(0, 3);
    }

    /**
     * Batch extract concepts from multiple questions
     */
    async batchExtract(questions, category = null) {
        const results = [];
        for (const q of questions) {
            const concepts = await this.extractFromQuestion(
                q.question || q.question_text,
                q.answer,
                category
            );
            results.push({ questionId: q.id, concepts });
        }
        return results;
    }

    /**
     * Determine difficulty level of a question
     * @param {string} questionText - Question text
     * @param {number} answerCount - Number of answer options
     * @returns {string} Difficulty level (easy, medium, hard)
     */
    estimateDifficulty(questionText, answerCount = 4) {
        const length = questionText.length;
        const wordCount = questionText.split(/\s+/).length;

        // Heuristics
        if (wordCount < 10 && answerCount <= 4) return "easy";
        if (wordCount > 25 || answerCount > 5) return "hard";
        return "medium";
    }

    /**
     * Estimate time needed to answer question
     * @param {string} difficulty
     * @param {string} questionType
     * @returns {number} Estimated seconds
     */
    estimateTime(difficulty, questionType = "mcq") {
        const baseTime = {
            easy: 30,
            medium: 60,
            hard: 90,
        };

        const typeMultiplier = {
            mcq: 1.0,
            short: 1.2,
            truefalse: 0.7,
        };

        return Math.round(
            baseTime[difficulty] * (typeMultiplier[questionType] || 1.0)
        );
    }

    _capitalizeWords(str) {
        return str
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    _deduplicateConcepts(concepts) {
        const seen = new Map();
        for (const concept of concepts) {
            const key = concept.name.toLowerCase();
            if (
                !seen.has(key) ||
                seen.get(key).confidence < concept.confidence
            ) {
                seen.set(key, concept);
            }
        }
        return Array.from(seen.values()).sort(
            (a, b) => b.confidence - a.confidence
        );
    }

    /**
     * Enrich question with concept metadata
     * @param {Object} question - Question object
     * @param {string} category - Category hint
     * @returns {Object} Enriched question
     */
    async enrichQuestion(question, category = null) {
        const concepts = await this.extractFromQuestion(
            question.question,
            question.answer,
            category
        );

        const difficulty =
            question.difficulty ||
            this.estimateDifficulty(
                question.question,
                question.options?.length
            );

        const estimatedSeconds = this.estimateTime(difficulty, question.type);

        return {
            ...question,
            conceptTags: concepts.map((c) => c.name),
            difficulty,
            estimatedSeconds,
            conceptCategory: concepts[0]?.category || category || "General",
        };
    }
}
