import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    listDecks,
    createDeck,
    getDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    getStudyCards,
    reviewCard,
    generateCards,
} from "../controllers/flashcardController.js";

const router = Router();

// All flashcard routes require auth
router.use(requireAuth);

// Deck CRUD
router.get("/decks", listDecks);
router.post("/decks", createDeck);
router.get("/decks/:deckId", getDeck);
router.delete("/decks/:deckId", deleteDeck);

// Card CRUD
router.post("/decks/:deckId/cards", addCard);
router.put("/decks/:deckId/cards/:cardId", updateCard);
router.delete("/decks/:deckId/cards/:cardId", deleteCard);

// Study session
router.get("/decks/:deckId/study", getStudyCards);
router.post("/decks/:deckId/cards/:cardId/review", reviewCard);

// AI generation
router.post("/decks/:deckId/generate", generateCards);

export default router;
