import { v4 as uuid } from "uuid";
import { FlashcardDeckRepository, FlashcardRepository } from "../repositories/flashcardRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";

const deckRepo = new FlashcardDeckRepository();
const cardRepo = new FlashcardRepository();

// ==================== Deck Endpoints ====================

export async function listDecks(req, res, next) {
    try {
        const userId = req.user.id;
        const decks = await deckRepo.findByUser(userId);
        res.json({
            decks: decks.map((d) => ({
                id: d.id,
                title: d.title,
                description: d.description,
                conceptName: d.concept_name,
                cardCount: d.card_count,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function createDeck(req, res, next) {
    try {
        const userId = req.user.id;
        const { title, description, conceptName } = req.body;
        if (!title || !title.trim()) {
            throw ApiError.badRequest("Title is required");
        }
        const deck = await deckRepo.create({
            id: uuid(),
            userId,
            title: title.trim(),
            description: description?.trim() || null,
            conceptName: conceptName?.trim() || null,
        });
        res.status(201).json({
            id: deck.id,
            title: deck.title,
            description: deck.description,
            conceptName: deck.concept_name,
            cardCount: deck.card_count,
            createdAt: deck.created_at,
        });
    } catch (e) {
        next(e);
    }
}

export async function getDeck(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId } = req.params;
        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        const cards = await cardRepo.findByDeck(deckId);
        const dueCount = cards.filter(
            (c) => new Date(c.next_review) <= new Date()
        ).length;
        res.json({
            id: deck.id,
            title: deck.title,
            description: deck.description,
            conceptName: deck.concept_name,
            cardCount: deck.card_count,
            dueCount,
            createdAt: deck.created_at,
            updatedAt: deck.updated_at,
            cards: cards.map((c) => ({
                id: c.id,
                front: c.front,
                back: c.back,
                difficulty: c.difficulty,
                intervalDays: c.interval_days,
                nextReview: c.next_review,
                reviewCount: c.review_count,
                correctCount: c.correct_count,
                isDue: new Date(c.next_review) <= new Date(),
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function deleteDeck(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId } = req.params;
        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        await deckRepo.delete(deckId);
        res.json({ deleted: true });
    } catch (e) {
        next(e);
    }
}

// ==================== Card Endpoints ====================

export async function addCard(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId } = req.params;
        const { front, back } = req.body;
        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        if (!front?.trim() || !back?.trim()) {
            throw ApiError.badRequest("Front and back are required");
        }
        const card = await cardRepo.create({
            id: uuid(),
            deckId,
            front: front.trim(),
            back: back.trim(),
        });
        await deckRepo.updateCardCount(deckId);
        res.status(201).json({
            id: card.id,
            front: card.front,
            back: card.back,
            nextReview: card.next_review,
        });
    } catch (e) {
        next(e);
    }
}

export async function updateCard(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId, cardId } = req.params;
        const { front, back } = req.body;
        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        const card = await cardRepo.findById(cardId);
        if (!card || card.deck_id !== deckId) {
            throw ApiError.notFound("Card not found");
        }
        const updated = await cardRepo.update(cardId, { front, back });
        res.json({ id: updated.id, front: updated.front, back: updated.back });
    } catch (e) {
        next(e);
    }
}

export async function deleteCard(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId, cardId } = req.params;
        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        await cardRepo.delete(cardId);
        await deckRepo.updateCardCount(deckId);
        res.json({ deleted: true });
    } catch (e) {
        next(e);
    }
}

// ==================== Study Session ====================

export async function getStudyCards(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        const cards = await cardRepo.getDueCards(deckId, limit);
        res.json({
            deckId,
            deckTitle: deck.title,
            dueCount: cards.length,
            cards: cards.map((c) => ({
                id: c.id,
                front: c.front,
                back: c.back,
                difficulty: c.difficulty,
                reviewCount: c.review_count,
            })),
        });
    } catch (e) {
        next(e);
    }
}

export async function reviewCard(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId, cardId } = req.params;
        const { quality } = req.body; // 0-5 (SM-2 scale: 0=forgot, 3=hard, 4=good, 5=easy)

        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        const card = await cardRepo.findById(cardId);
        if (!card || card.deck_id !== deckId) {
            throw ApiError.notFound("Card not found");
        }

        if (quality === undefined || quality < 0 || quality > 5) {
            throw ApiError.badRequest("Quality must be 0-5");
        }

        // SM-2 spaced repetition algorithm
        let easeFactor = card.ease_factor || 2.5;
        let interval = card.interval_days || 0;
        const correct = quality >= 3;

        if (quality < 3) {
            // Failed — reset interval
            interval = 0;
        } else {
            if (interval === 0) {
                interval = 1;
            } else if (interval === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
        }

        // Update ease factor
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + Math.max(interval, 0));
        // For failed cards, review again in 10 minutes
        if (!correct) {
            nextReview.setTime(Date.now() + 10 * 60 * 1000);
        }

        const updated = await cardRepo.updateReview(cardId, {
            difficulty: quality,
            intervalDays: interval,
            easeFactor,
            nextReview: nextReview.toISOString(),
            correct,
        });

        res.json({
            cardId: updated.id,
            nextReview: updated.next_review,
            intervalDays: interval,
            easeFactor,
            correct,
        });
    } catch (e) {
        next(e);
    }
}

// ==================== AI Generation ====================

export async function generateCards(req, res, next) {
    try {
        const userId = req.user.id;
        const { deckId } = req.params;
        const { topic, count = 10 } = req.body;

        const deck = await deckRepo.findById(deckId);
        if (!deck || deck.user_id !== userId) {
            throw ApiError.notFound("Deck not found");
        }
        if (!topic?.trim()) {
            throw ApiError.badRequest("Topic is required");
        }

        const cardCount = Math.min(Math.max(parseInt(count) || 10, 1), 30);

        // DRY_RUN mode for tests
        if (process.env.DRY_RUN_AI === "true") {
            const mockCards = [];
            for (let i = 0; i < cardCount; i++) {
                mockCards.push({
                    id: uuid(),
                    deckId,
                    front: `What is ${topic} concept ${i + 1}?`,
                    back: `${topic} concept ${i + 1} explanation.`,
                });
            }
            const created = await cardRepo.bulkCreate(mockCards);
            await deckRepo.updateCardCount(deckId);
            return res.status(201).json({
                generated: created.length,
                cards: created.map((c) => ({ id: c.id, front: c.front, back: c.back })),
            });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw ApiError.internal("Missing OPENROUTER_API_KEY", "MISSING_API_KEY");
        }

        const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
        const prompt = `Generate ${cardCount} flashcards about "${topic.trim()}".
Each card should help someone learn and memorize key concepts.
Vary difficulty — include basic definitions, applications, and tricky edge cases.
Return ONLY a JSON object with a "cards" array. Each card has "front" (question/prompt) and "back" (answer/explanation).
Keep answers concise but complete.`;

        const headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        };
        if (process.env.OPENROUTER_SITE_URL) {
            headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers,
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: "You output ONLY JSON. No prose. No explanations." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
            }),
        });

        const responseText = await response.text();
        let aiCards = [];
        try {
            const parsed = JSON.parse(responseText);
            const content = parsed?.choices?.[0]?.message?.content || "";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const cardData = JSON.parse(jsonMatch[0]);
                aiCards = cardData.cards || [];
            }
        } catch (parseErr) {
            logger.error({ parseErr }, "Failed to parse AI flashcard response");
            throw ApiError.internal("Failed to generate flashcards");
        }

        if (aiCards.length === 0) {
            throw ApiError.internal("AI returned no flashcards");
        }

        const cardsToCreate = aiCards.slice(0, cardCount).map((c) => ({
            id: uuid(),
            deckId,
            front: c.front || c.question || "?",
            back: c.back || c.answer || "?",
        }));

        const created = await cardRepo.bulkCreate(cardsToCreate);
        await deckRepo.updateCardCount(deckId);

        res.status(201).json({
            generated: created.length,
            cards: created.map((c) => ({ id: c.id, front: c.front, back: c.back })),
        });
    } catch (e) {
        next(e);
    }
}
