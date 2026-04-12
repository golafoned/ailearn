import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { apiFetch } from "../utils/apiClient";
import { useToast } from "../contexts/ToastContext";

export function FlashcardDeckPage() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("cards"); // cards | study | generate
    const [newFront, setNewFront] = useState("");
    const [newBack, setNewBack] = useState("");
    const [addingCard, setAddingCard] = useState(false);

    // Study state
    const [studyCards, setStudyCards] = useState([]);
    const [studyIndex, setStudyIndex] = useState(0);
    const [showBack, setShowBack] = useState(false);
    const [studyLoading, setStudyLoading] = useState(false);
    const [studyComplete, setStudyComplete] = useState(false);
    const [studyStats, setStudyStats] = useState({ correct: 0, total: 0 });

    // Generate state
    const [genTopic, setGenTopic] = useState("");
    const [genCount, setGenCount] = useState(10);
    const [generating, setGenerating] = useState(false);

    const fetchDeck = useCallback(async () => {
        try {
            const data = await apiFetch(`/api/v1/flashcards/decks/${deckId}`);
            setDeck(data);
        } catch {
            toast.error("Failed to load deck");
            navigate("/flashcards");
        } finally {
            setLoading(false);
        }
    }, [deckId, toast, navigate]);

    useEffect(() => {
        fetchDeck();
    }, [fetchDeck]);

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!newFront.trim() || !newBack.trim()) return;
        setAddingCard(true);
        try {
            await apiFetch(`/api/v1/flashcards/decks/${deckId}/cards`, {
                method: "POST",
                body: { front: newFront.trim(), back: newBack.trim() },
            });
            setNewFront("");
            setNewBack("");
            await fetchDeck();
            toast.success("Card added!");
        } catch {
            toast.error("Failed to add card");
        } finally {
            setAddingCard(false);
        }
    };

    const handleDeleteCard = async (cardId) => {
        try {
            await apiFetch(`/api/v1/flashcards/decks/${deckId}/cards/${cardId}`, {
                method: "DELETE",
            });
            await fetchDeck();
        } catch {
            toast.error("Failed to delete card");
        }
    };

    const startStudy = async () => {
        setStudyLoading(true);
        setStudyComplete(false);
        setStudyStats({ correct: 0, total: 0 });
        try {
            const data = await apiFetch(`/api/v1/flashcards/decks/${deckId}/study?limit=20`);
            if (data.cards.length === 0) {
                toast.info("No cards due for review!");
                setTab("cards");
                return;
            }
            setStudyCards(data.cards);
            setStudyIndex(0);
            setShowBack(false);
            setTab("study");
        } catch {
            toast.error("Failed to start study session");
        } finally {
            setStudyLoading(false);
        }
    };

    const handleReview = async (quality) => {
        const card = studyCards[studyIndex];
        try {
            await apiFetch(
                `/api/v1/flashcards/decks/${deckId}/cards/${card.id}/review`,
                { method: "POST", body: { quality } }
            );
            const correct = quality >= 3;
            setStudyStats((prev) => ({
                correct: prev.correct + (correct ? 1 : 0),
                total: prev.total + 1,
            }));
            if (studyIndex < studyCards.length - 1) {
                setStudyIndex((i) => i + 1);
                setShowBack(false);
            } else {
                setStudyComplete(true);
            }
        } catch {
            toast.error("Failed to save review");
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!genTopic.trim()) return;
        setGenerating(true);
        try {
            const result = await apiFetch(`/api/v1/flashcards/decks/${deckId}/generate`, {
                method: "POST",
                body: { topic: genTopic.trim(), count: genCount },
            });
            toast.success(`Generated ${result.generated} cards!`);
            setGenTopic("");
            await fetchDeck();
            setTab("cards");
        } catch {
            toast.error("Failed to generate cards");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-24">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading deck...</p>
                </div>
            </div>
        );
    }

    if (!deck) return null;

    const currentStudyCard = studyCards[studyIndex];

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button onClick={() => navigate("/flashcards")} className="text-blue-600 hover:text-blue-700">
                    ← Back
                </button>
            </div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{deck.title}</h1>
                    {deck.description && (
                        <p className="text-gray-600 mt-1">{deck.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                        {deck.cardCount} cards • {deck.dueCount} due for review
                    </p>
                </div>
                <Button
                    onClick={startStudy}
                    disabled={studyLoading || deck.cardCount === 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                    {studyLoading ? "Loading..." : "📖 Study Now"}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8">
                {[
                    { key: "cards", label: "📋 Cards" },
                    { key: "study", label: "📖 Study" },
                    { key: "generate", label: "🤖 AI Generate" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => t.key === "study" ? startStudy() : setTab(t.key)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            tab === t.key
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Cards Tab */}
            {tab === "cards" && (
                <div>
                    {/* Add Card Form */}
                    <form onSubmit={handleAddCard} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Add New Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Front</label>
                                <textarea
                                    value={newFront}
                                    onChange={(e) => setNewFront(e.target.value)}
                                    placeholder="Question or prompt"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Back</label>
                                <textarea
                                    value={newBack}
                                    onChange={(e) => setNewBack(e.target.value)}
                                    placeholder="Answer or explanation"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={addingCard || !newFront.trim() || !newBack.trim()}>
                            {addingCard ? "Adding..." : "+ Add Card"}
                        </Button>
                    </form>

                    {/* Card List */}
                    {deck.cards && deck.cards.length > 0 ? (
                        <div className="space-y-3">
                            {deck.cards.map((card, idx) => (
                                <div key={card.id} className={`bg-white rounded-lg border p-4 ${card.isDue ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
                                                {card.isDue && (
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Due</span>
                                                )}
                                                {card.reviewCount > 0 && (
                                                    <span className="text-xs text-gray-400">
                                                        {card.correctCount}/{card.reviewCount} correct
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-medium text-gray-900">{card.front}</p>
                                            <p className="text-sm text-gray-600 mt-1">{card.back}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="text-gray-400 hover:text-red-500 ml-3 p-1"
                                            title="Delete card"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-5xl mb-4 block">📝</span>
                            <p className="text-gray-600">No cards yet. Add cards manually or use AI generation!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Study Tab */}
            {tab === "study" && (
                <div>
                    {studyComplete ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <span className="text-7xl mb-6 block animate-bounce">🎉</span>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
                            <p className="text-lg text-gray-600 mb-6">
                                {studyStats.correct} / {studyStats.total} correct
                                ({studyStats.total > 0 ? Math.round((studyStats.correct / studyStats.total) * 100) : 0}%)
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={startStudy}>Study Again</Button>
                                <Button variant="secondary" onClick={() => setTab("cards")}>
                                    Back to Cards
                                </Button>
                            </div>
                        </div>
                    ) : currentStudyCard ? (
                        <div className="max-w-2xl mx-auto">
                            <div className="text-center text-sm text-gray-500 mb-4">
                                Card {studyIndex + 1} of {studyCards.length}
                            </div>
                            {/* Flashcard */}
                            <div
                                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
                                onClick={() => setShowBack(!showBack)}
                            >
                                {!showBack ? (
                                    <>
                                        <span className="text-xs uppercase tracking-wider text-gray-400 mb-4">Front</span>
                                        <p className="text-xl font-semibold text-gray-900 text-center leading-relaxed">
                                            {currentStudyCard.front}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-6">Click to reveal answer</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs uppercase tracking-wider text-green-500 mb-4">Answer</span>
                                        <p className="text-xl text-gray-800 text-center leading-relaxed">
                                            {currentStudyCard.back}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Review buttons (shown after revealing) */}
                            {showBack && (
                                <div className="mt-6">
                                    <p className="text-center text-sm text-gray-600 mb-3">How well did you know this?</p>
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleReview(0)}
                                            className="px-4 py-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium text-sm transition-colors"
                                        >
                                            😵 Forgot
                                        </button>
                                        <button
                                            onClick={() => handleReview(3)}
                                            className="px-4 py-3 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium text-sm transition-colors"
                                        >
                                            😓 Hard
                                        </button>
                                        <button
                                            onClick={() => handleReview(4)}
                                            className="px-4 py-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium text-sm transition-colors"
                                        >
                                            🙂 Good
                                        </button>
                                        <button
                                            onClick={() => handleReview(5)}
                                            className="px-4 py-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium text-sm transition-colors"
                                        >
                                            😎 Easy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                            <span className="text-5xl mb-4 block">✅</span>
                            <p className="text-gray-600 mb-4">No cards due for review right now!</p>
                            <Button variant="secondary" onClick={() => setTab("cards")}>
                                Back to Cards
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Generate Tab */}
            {tab === "generate" && (
                <div className="max-w-xl mx-auto">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Flashcard Generator</h2>
                        <p className="text-gray-600 mb-6">
                            Enter a topic and AI will generate flashcards for you using spaced repetition-optimized content.
                        </p>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                                <input
                                    type="text"
                                    value={genTopic}
                                    onChange={(e) => setGenTopic(e.target.value)}
                                    placeholder="e.g. Python decorators, React hooks, SQL joins..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    disabled={generating}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of cards: {genCount}
                                </label>
                                <input
                                    type="range"
                                    min={5}
                                    max={30}
                                    value={genCount}
                                    onChange={(e) => setGenCount(parseInt(e.target.value))}
                                    className="w-full accent-purple-600"
                                    disabled={generating}
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>5</span><span>30</span>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={generating || !genTopic.trim()}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                                {generating ? (
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        Generating...
                                    </span>
                                ) : (
                                    `✨ Generate ${genCount} Cards`
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
