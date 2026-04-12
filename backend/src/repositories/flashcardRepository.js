import { queryOne, queryAll, run } from "../db/index.js";

export class FlashcardDeckRepository {
    async create({ id, userId, title, description, conceptName }) {
        await run(
            `INSERT INTO flashcard_decks (id, user_id, title, description, concept_name)
             VALUES (?, ?, ?, ?, ?)`,
            [id, userId, title, description || null, conceptName || null]
        );
        return this.findById(id);
    }

    async findById(id) {
        return queryOne(`SELECT * FROM flashcard_decks WHERE id = ?`, [id]);
    }

    async findByUser(userId) {
        return queryAll(
            `SELECT * FROM flashcard_decks WHERE user_id = ? ORDER BY updated_at DESC`,
            [userId]
        );
    }

    async update(id, { title, description }) {
        const sets = [];
        const params = [];
        if (title !== undefined) { sets.push("title = ?"); params.push(title); }
        if (description !== undefined) { sets.push("description = ?"); params.push(description); }
        if (sets.length === 0) return this.findById(id);
        sets.push("updated_at = datetime('now')");
        params.push(id);
        await run(`UPDATE flashcard_decks SET ${sets.join(", ")} WHERE id = ?`, params);
        return this.findById(id);
    }

    async updateCardCount(deckId) {
        await run(
            `UPDATE flashcard_decks SET card_count = (SELECT COUNT(*) FROM flashcards WHERE deck_id = ?), updated_at = datetime('now') WHERE id = ?`,
            [deckId, deckId]
        );
    }

    async delete(id) {
        await run(`DELETE FROM flashcards WHERE deck_id = ?`, [id]);
        await run(`DELETE FROM flashcard_decks WHERE id = ?`, [id]);
    }
}

export class FlashcardRepository {
    async create({ id, deckId, front, back }) {
        await run(
            `INSERT INTO flashcards (id, deck_id, front, back)
             VALUES (?, ?, ?, ?)`,
            [id, deckId, front, back]
        );
        return this.findById(id);
    }

    async findById(id) {
        return queryOne(`SELECT * FROM flashcards WHERE id = ?`, [id]);
    }

    async findByDeck(deckId) {
        return queryAll(
            `SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at`,
            [deckId]
        );
    }

    async getDueCards(deckId, limit = 20) {
        return queryAll(
            `SELECT * FROM flashcards WHERE deck_id = ? AND next_review <= datetime('now')
             ORDER BY next_review ASC LIMIT ?`,
            [deckId, limit]
        );
    }

    async getDueCardsByUser(userId, limit = 20) {
        return queryAll(
            `SELECT f.* FROM flashcards f
             JOIN flashcard_decks d ON f.deck_id = d.id
             WHERE d.user_id = ? AND f.next_review <= datetime('now')
             ORDER BY f.next_review ASC LIMIT ?`,
            [userId, limit]
        );
    }

    async updateReview(id, { difficulty, intervalDays, easeFactor, nextReview, correct }) {
        await run(
            `UPDATE flashcards SET
                difficulty = ?, interval_days = ?, ease_factor = ?,
                next_review = ?, review_count = review_count + 1,
                correct_count = correct_count + ?,
                updated_at = datetime('now')
             WHERE id = ?`,
            [difficulty, intervalDays, easeFactor, nextReview, correct ? 1 : 0, id]
        );
        return this.findById(id);
    }

    async update(id, { front, back }) {
        const sets = [];
        const params = [];
        if (front !== undefined) { sets.push("front = ?"); params.push(front); }
        if (back !== undefined) { sets.push("back = ?"); params.push(back); }
        if (sets.length === 0) return this.findById(id);
        sets.push("updated_at = datetime('now')");
        params.push(id);
        await run(`UPDATE flashcards SET ${sets.join(", ")} WHERE id = ?`, params);
        return this.findById(id);
    }

    async delete(id) {
        await run(`DELETE FROM flashcards WHERE id = ?`, [id]);
    }

    async bulkCreate(cards) {
        const results = [];
        for (const card of cards) {
            const result = await this.create(card);
            results.push(result);
        }
        return results;
    }
}
