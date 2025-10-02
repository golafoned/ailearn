import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { ApiError } from "../utils/apiClient";
import { ReviewGeneratorModal } from "../components/ReviewGeneratorModal";

// Participant view of their own attempt detail
export function MyAttemptDetailPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { fetchAttemptDetail, attemptDetail } = useTestData();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const load = useCallback(async () => {
        if (!attemptId) return;
        setLoading(true);
        setError(null);
        try {
            await fetchAttemptDetail(attemptId);
        } catch (e) {
            setError(
                e instanceof ApiError ? e.message : "Failed to load attempt"
            );
        } finally {
            setLoading(false);
        }
    }, [attemptId, fetchAttemptDetail]);

    useEffect(() => {
        load();
    }, [load]);

    const detail = attemptDetail;
    const answerItems = detail?.answers || detail?.questions || [];

    // Calculate stats
    const totalQuestions = answerItems.length;
    const correctCount = answerItems.filter((a) => a.correct === true).length;
    const wrongCount = answerItems.filter((a) => a.correct === false).length;
    const hasWrongAnswers = wrongCount > 0;

    const handleReviewModalClose = (result) => {
        setShowReviewModal(false);
        if (result?.code) {
            // Navigate to the new review test
            navigate(`/review-tests/${result.code}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
            <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
            >
                <span className="mr-2">←</span> Back to Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Test Results
                    </h1>
                    {detail && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-2">
                                <span className="font-medium">Code:</span>
                                <code className="px-2 py-0.5 bg-white rounded font-mono text-xs border">
                                    {detail.testCode || detail.code || "—"}
                                </code>
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <span className="font-medium">Submitted:</span>
                                {detail.submittedAt
                                    ? new Date(
                                          detail.submittedAt
                                      ).toLocaleString()
                                    : "—"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Score Summary */}
                {detail && (
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-1">
                                    Your Score
                                </h2>
                                <p className="text-4xl font-bold text-blue-600">
                                    {detail.score}%
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {correctCount}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Correct
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">
                                            {wrongCount}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Wrong
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-600">
                                            {totalQuestions}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Total
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Review Button */}
                        {hasWrongAnswers && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">📝</span>
                                    <span>
                                        Generate Review Test from Wrong Answers
                                    </span>
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
                                        {wrongCount} questions
                                    </span>
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    AI will create personalized practice
                                    questions based on concepts you missed
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading results...</p>
                </div>
            )}

            {/* Questions Review */}
            <div className="space-y-4">
                {answerItems.map((a, idx) => {
                    const chosen = a.userAnswer ?? a.answer;
                    const isCorrect = a.correct === true;

                    return (
                        <div
                            key={a.questionId || idx}
                            className={`border-2 rounded-xl p-5 bg-white shadow-sm transition-all hover:shadow-md ${
                                isCorrect
                                    ? "border-green-200 bg-green-50/30"
                                    : "border-red-200 bg-red-50/30"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                            Q{idx + 1}
                                        </span>
                                        <span
                                            className={`text-xs font-bold inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                                                isCorrect
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {isCorrect ? (
                                                <>
                                                    <span className="text-base">
                                                        ✓
                                                    </span>
                                                    Correct
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-base">
                                                        ✗
                                                    </span>
                                                    Incorrect
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {a.question || a.prompt || "Question"}
                                    </h3>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                                        Your answer:
                                    </span>
                                    <span
                                        className={`text-sm font-semibold ${
                                            isCorrect
                                                ? "text-green-700"
                                                : "text-red-700"
                                        }`}
                                    >
                                        {chosen || (
                                            <em className="text-gray-400">
                                                Not answered
                                            </em>
                                        )}
                                    </span>
                                </div>

                                {/* NEVER show correct answer to participant - backend already hides it */}
                                {/* Only show hint for wrong answers */}
                                {!isCorrect && a.hint && (
                                    <div className="mt-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-r-lg">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl">💡</span>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-yellow-800 mb-1 uppercase tracking-wide">
                                                    Study Hint
                                                </p>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {a.hint}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {!loading && answerItems.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No answers available.</p>
                    </div>
                )}
            </div>

            {/* Bottom CTA for review generation */}
            {hasWrongAnswers && !loading && (
                <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Want to improve your score?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Generate a personalized review test with the{" "}
                        {wrongCount} questions you got wrong. Practice makes
                        perfect!
                    </p>
                    <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        Generate Review Test
                    </button>
                </div>
            )}

            {/* Review Generator Modal */}
            <ReviewGeneratorModal
                isOpen={showReviewModal}
                onClose={handleReviewModalClose}
                attemptId={attemptId}
            />
        </div>
    );
}
