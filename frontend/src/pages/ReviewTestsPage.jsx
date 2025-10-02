import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { ApiError } from "../utils/apiClient";

export function ReviewTestsPage() {
    const navigate = useNavigate();
    const { reviewTests, fetchReviewTests } = useTestData();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchReviewTests();
            } catch (e) {
                setError(
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load review tests"
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [fetchReviewTests]);

    const handleStartReview = (code) => {
        navigate(`/review-tests/${code}`);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-24 sm:py-32">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold">
                        My Review Tests
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">
                        📚 Practice tests generated from questions you got wrong
                    </p>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold">💡 How it works:</span> Each
                    review test contains AI-generated questions based on
                    concepts you previously answered incorrectly. Practice these
                    to master difficult topics!
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading review tests...</p>
                </div>
            )}

            {!loading && reviewTests.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="max-w-md mx-auto">
                        <p className="text-xl font-semibold text-gray-700 mb-2">
                            No review tests yet
                        </p>
                        <p className="text-sm text-gray-600 mb-6">
                            Generate your first review test from a completed
                            attempt to practice questions you got wrong.
                        </p>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}

            {!loading && reviewTests.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reviewTests.map((test) => (
                        <div
                            key={test.id}
                            className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-lg transition-all hover:border-purple-300"
                        >
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-block px-3 py-1 text-xs font-bold text-purple-700 bg-purple-100 rounded-full">
                                        📝 REVIEW
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {test.code}
                                    </span>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {test.title || "Review Practice"}
                                </h2>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4 bg-white/50 rounded-lg p-3 border border-purple-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-purple-600">📊</span>
                                    <span className="font-medium">
                                        Strategy:
                                    </span>
                                    <span className="capitalize flex-1 text-right">
                                        {test.strategy?.replace(/_/g, " ") ||
                                            "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-purple-600">❓</span>
                                    <span className="font-medium">
                                        Questions:
                                    </span>
                                    <span className="flex-1 text-right font-semibold text-purple-700">
                                        {test.questionCount || "—"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-purple-600">📅</span>
                                    <span className="font-medium">
                                        Created:
                                    </span>
                                    <span className="flex-1 text-right text-xs">
                                        {test.createdAt
                                            ? new Date(
                                                  test.createdAt
                                              ).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartReview(test.code)}
                                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
                            >
                                <span>🚀</span>
                                <span>Start Practice</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
