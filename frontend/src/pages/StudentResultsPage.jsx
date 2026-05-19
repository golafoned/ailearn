import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../utils/apiClient";
import { useToast } from "../contexts/ToastContext";

export function StudentResultsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { isAuthenticated } = useAuth();
    const { attempt, fetchAttemptDetail, attemptDetail } = useTestData();
    const [creatingDeck, setCreatingDeck] = useState(false);

    useEffect(() => {
        if (attempt?.id && attempt.submittedAt) {
            fetchAttemptDetail(attempt.id).catch(() => {});
        }
    }, [attempt, fetchAttemptDetail]);

    if (!attempt || !attempt.submittedAt) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                <p className="text-gray-600">No results to display.</p>
                <button
                    onClick={() => navigate("/learning")}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Go to Learning Dashboard
                </button>
            </div>
        );
    }

    const score = attempt.score ?? 0;
    const totalQuestions = attempt.totalQuestions ?? 0;
    const answered = attempt.answered ?? 0;
    const correctCount = Math.round((score / 100) * totalQuestions);

    const emoji =
        score >= 90 ? "🎉" : score >= 70 ? "👏" : score >= 50 ? "💪" : "📖";
    const message =
        score >= 90
            ? "Outstanding! You nailed it!"
            : score >= 70
              ? "Great job! Keep it up!"
              : score >= 50
                ? "Good effort! Review the missed questions."
                : "Keep practicing — you'll get there!";

    const answers = attemptDetail?.answers || [];
    const wrongAnswers = answers.filter((a) => !a.correct);

    const handleCreateFlashcards = async () => {
        setCreatingDeck(true);
        try {
            const resp = await apiFetch(
                "/api/v1/flashcards/decks/from-attempt",
                {
                    method: "POST",
                    body: { attemptId: attempt.id },
                },
            );
            toast.success(`Created deck with ${resp.cardCount} flashcards!`);
            navigate(`/flashcards/${resp.deckId}`);
        } catch (err) {
            toast.error(err?.message || "Failed to create flashcards");
        } finally {
            setCreatingDeck(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-24 sm:py-32">
            {/* Score header */}
            <div className="text-center mb-10">
                <div className="text-6xl mb-4 animate-bounce">{emoji}</div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {message}
                </h1>
                <div className="mt-4">
                    <div className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {score}%
                    </div>
                    <p className="mt-2 text-gray-500">
                        {correctCount} of {totalQuestions} correct
                        {answered < totalQuestions && ` (${answered} answered)`}
                    </p>
                </div>

                {/* Score bar */}
                <div className="mt-6 max-w-md mx-auto">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                                score >= 80
                                    ? "bg-green-500"
                                    : score >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                            }`}
                            style={{ width: `${score}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
                {isAuthenticated && wrongAnswers.length > 0 && (
                    <button
                        onClick={handleCreateFlashcards}
                        disabled={creatingDeck}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {creatingDeck
                            ? "Creating..."
                            : `🃏 Create Flashcards from ${wrongAnswers.length} Mistakes`}
                    </button>
                )}
                {isAuthenticated && (
                    <button
                        onClick={() => navigate("/learning/start")}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                    >
                        🚀 Continue Learning
                    </button>
                )}
                {attempt.id && (
                    <button
                        onClick={() => navigate(`/attempts/${attempt.id}`)}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                    >
                        📝 Detailed Results & Hints
                    </button>
                )}
            </div>

            {/* Question review */}
            {answers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Question Review
                    </h2>
                    {answers.map((a, idx) => (
                        <div
                            key={a.questionId || idx}
                            className={`border-2 rounded-xl p-5 ${
                                a.correct
                                    ? "border-green-200 bg-green-50/50"
                                    : "border-red-200 bg-red-50/50"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`text-lg font-bold ${
                                        a.correct
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {a.correct ? "✓" : "✗"}
                                </span>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 mb-2">
                                        Q{idx + 1}. {a.question}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Your answer:{" "}
                                        <span
                                            className={`font-medium ${
                                                a.correct
                                                    ? "text-green-700"
                                                    : "text-red-700"
                                            }`}
                                        >
                                            {a.userAnswer || "—"}
                                        </span>
                                    </p>
                                    {!a.correct && a.correctAnswer && (
                                        <p className="text-sm text-green-700 mt-1">
                                            Correct: {a.correctAnswer}
                                        </p>
                                    )}
                                    {!a.correct && a.hint && (
                                        <p className="text-sm text-gray-500 mt-2 italic">
                                            💡 {a.hint}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom CTAs */}
            <div className="mt-10 pt-8 border-t border-gray-200 text-center">
                <div className="flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={() => navigate("/learning")}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        📚 Learning Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/flashcards")}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        🃏 My Flashcards
                    </button>
                </div>
            </div>
        </div>
    );
}
