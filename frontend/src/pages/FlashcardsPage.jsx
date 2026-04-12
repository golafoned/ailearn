import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { apiFetch } from "../utils/apiClient";
import { useToast } from "../contexts/ToastContext";

export function FlashcardsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchDecks = useCallback(async () => {
        try {
            const data = await apiFetch("/api/v1/flashcards/decks");
            setDecks(data.decks || []);
        } catch {
            toast.error("Failed to load decks");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

    const handleCreateDeck = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const deck = await apiFetch("/api/v1/flashcards/decks", {
                method: "POST",
                body: { title: newTitle.trim(), description: newDescription.trim() || undefined },
            });
            setDecks((prev) => [deck, ...prev]);
            setNewTitle("");
            setNewDescription("");
            setShowCreate(false);
            toast.success("Deck created!");
        } catch {
            toast.error("Failed to create deck");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteDeck = async (deckId) => {
        if (!confirm("Delete this deck and all its cards?")) return;
        try {
            await apiFetch(`/api/v1/flashcards/decks/${deckId}`, { method: "DELETE" });
            setDecks((prev) => prev.filter((d) => d.id !== deckId));
            toast.success("Deck deleted");
        } catch {
            toast.error("Failed to delete deck");
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-24">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading flashcards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-24 sm:py-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">🃏 Flashcards</h1>
                    <p className="text-gray-600 mt-1">Study with spaced repetition</p>
                </div>
                <Button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                    + New Deck
                </Button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateDeck} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Create New Deck</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="e.g. JavaScript Fundamentals"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Optional description"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="submit" disabled={creating || !newTitle.trim()}>
                                {creating ? "Creating..." : "Create Deck"}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {decks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                    <span className="text-7xl mb-6 block">🃏</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No flashcard decks yet</h2>
                    <p className="text-gray-600 mb-6">Create your first deck to start studying with spaced repetition</p>
                    <Button onClick={() => setShowCreate(true)}>
                        Create Your First Deck
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => (
                        <div
                            key={deck.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => navigate(`/flashcards/${deck.id}`)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {deck.title}
                                </h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete deck"
                                >
                                    ✕
                                </button>
                            </div>
                            {deck.description && (
                                <p className="text-sm text-gray-600 mb-4">{deck.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {deck.cardCount || 0} cards
                                </span>
                                <span className="text-xs text-gray-400">
                                    {deck.updatedAt ? new Date(deck.updatedAt).toLocaleDateString() : ""}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
