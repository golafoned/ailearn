import { logger } from "../config/logger.js";

export class ConceptExtractionService {
    /**
     * Extract concepts from question text using AI or keyword matching
     * @param {string} questionText - The question text
     * @param {string} answer - The correct answer
     * @param {string} category - Optional category hint
     * @param {string} explanation - Optional explanation
     * @returns {Array<Object>} Array of concepts with confidence scores
     */
    async extractFromQuestion(questionText, answer, category = null, explanation = null) {
        // Use AI if possible, fallback to keyword
        if (process.env.NODE_ENV !== "test" || process.env.DRY_RUN_AI === "false") {
            try {
                return await this._extractWithAI(questionText, answer, explanation, category);
            } catch (e) {
                logger.warn({ error: e.message }, "AI Concept Extraction failed, falling back to keywords");
                return this._extractWithKeywords(questionText, answer, category);
            }
        } else {
            return this._extractWithKeywords(questionText, answer, category);
        }
    }

    async _extractWithAI(questionText, answer, explanation, category) {
        // Reuse TestGenerationService's OpenRouter integration
        const { TestGenerationService } = await import("./testGenerationService.js");
        const genService = new TestGenerationService();
        
        const prompt = `Analyze the following educational question and extract the core underlying academic concepts or skills required to answer it.
        
Question: ${questionText}
Answer: ${answer || "N/A"}
Explanation: ${explanation || "N/A"}
Category hint: ${category || "General"}

Requirements:
- Extract 1 to 4 highly specific concepts (e.g., "Photosynthesis", "Quadratic Equations", "Newton's Second Law").
- Avoid overly broad topics like "Biology" or "Math".
- Provide a confidence score (1-100) for each concept based on how central it is to the question.
- Output ONLY JSON with the following structure:
{
  "concepts": [
    { "name": "Concept Name", "confidence": 95, "category": "Specific Category" }
  ]
}`;

        // Create a custom _callOpenRouterJSON wrapper specifically for concepts if needed, 
        // but we can just use the raw endpoint or a simplified version here for reliability.
        const apiKey = process.env.OPENROUTER_API_KEY;
        const model = "openai/gpt-4o-mini";
        
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
        
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("Empty response from AI");
        
        const parsed = JSON.parse(content);
        
        if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
            throw new Error("Invalid schema returned by AI");
        }

        return parsed.concepts.map(c => ({
            name: this._capitalizeWords(c.name || "Unknown"),
            category: c.category || category || "General",
            confidence: c.confidence || 80,
            source: "ai"
        })).slice(0, 5);
    }

    _extractWithKeywords(questionText, answer, category) {
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
                category,
                q.explanation
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
            category,
            question.explanation
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
