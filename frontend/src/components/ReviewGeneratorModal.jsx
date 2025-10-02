import React, { useState, useEffect } from "react";
import { useTestData } from "../contexts/TestDataContext";
import { useToast } from "../contexts/ToastContext";
import { ApiError } from "../utils/apiClient";

export function ReviewGeneratorModal({ isOpen, onClose, attemptId = null }) {
    const { generateReview, myAttempts, fetchMyAttempts } = useTestData();
    const toast = useToast();

    const [strategy, setStrategy] = useState("wrong_recent");
    const [selectedAttemptId, setSelectedAttemptId] = useState(attemptId || "");
    const [questionCount, setQuestionCount] = useState(10);
    const [variantMode, setVariantMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingAttempts, setLoadingAttempts] = useState(false);

    // Fetch attempts when modal opens
    useEffect(() => {
        if (isOpen && !myAttempts.length) {
            const load = async () => {
                setLoadingAttempts(true);
                try {
                    await fetchMyAttempts();
                } catch (e) {
                    toast.error(
                        e instanceof ApiError
                            ? e.message
                            : "Failed to load attempts"
                    );
                } finally {
                    setLoadingAttempts(false);
                }
            };
            load();
        }
    }, [isOpen, myAttempts.length, fetchMyAttempts, toast]);

    // Set attemptId from prop if provided
    useEffect(() => {
        if (attemptId) {
            setSelectedAttemptId(attemptId);
        }
    }, [attemptId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedAttemptId) {
            toast.error("Please select an attempt");
            return;
        }

        setLoading(true);
        try {
            const result = await generateReview({
                strategy,
                attemptId: selectedAttemptId,
                questionCount,
                variantMode,
            });

            toast.success(
                `✨ Review test with ${questionCount} questions created! Starting now...`
            );
            onClose(result); // Pass result back to parent
        } catch (e) {
            // Error is already handled in context with toast
            console.error("Review generation error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Generate Review Test
                        </h2>
                        <button
                            onClick={() => onClose()}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            disabled={loading}
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Create a practice test from questions you got wrong
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Strategy Selection */}
                    <div>
                        <label
                            htmlFor="strategy"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Review Strategy *
                        </label>
                        <select
                            id="strategy"
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        >
                            <option value="wrong_recent">
                                Recent Wrong Answers
                            </option>
                            <option value="spaced_repetition">
                                Spaced Repetition
                            </option>
                            <option value="mix">Mixed Strategy</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Choose how questions are selected from your wrong
                            answers
                        </p>
                    </div>

                    {/* Attempt Selection */}
                    <div>
                        <label
                            htmlFor="attempt"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Source Attempt *
                        </label>
                        {loadingAttempts ? (
                            <p className="text-sm text-gray-500">
                                Loading attempts...
                            </p>
                        ) : (
                            <>
                                <select
                                    id="attempt"
                                    value={selectedAttemptId}
                                    onChange={(e) =>
                                        setSelectedAttemptId(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loading || !!attemptId}
                                >
                                    <option value="">
                                        Select an attempt...
                                    </option>
                                    {myAttempts.map((att) => (
                                        <option key={att.id} value={att.id}>
                                            {att.testTitle || "Test"} -{" "}
                                            {att.submittedAt
                                                ? new Date(
                                                      att.submittedAt
                                                  ).toLocaleDateString()
                                                : "—"}{" "}
                                            ({att.score}%)
                                        </option>
                                    ))}
                                </select>
                                {attemptId && (
                                    <p className="mt-1 text-xs text-blue-600">
                                        Pre-selected from current attempt
                                    </p>
                                )}
                            </>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Review test will be based on wrong answers from this
                            attempt
                        </p>
                    </div>

                    {/* Question Count */}
                    <div>
                        <label
                            htmlFor="questionCount"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Number of Questions *
                        </label>
                        <input
                            id="questionCount"
                            type="number"
                            min="1"
                            max="50"
                            value={questionCount}
                            onChange={(e) =>
                                setQuestionCount(parseInt(e.target.value) || 10)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Maximum questions to include (1-50)
                        </p>
                    </div>

                    {/* Variant Mode Toggle */}
                    <div className="flex items-center">
                        <input
                            id="variantMode"
                            type="checkbox"
                            checked={variantMode}
                            onChange={(e) => setVariantMode(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={loading}
                        />
                        <label
                            htmlFor="variantMode"
                            className="ml-2 text-sm text-gray-700"
                        >
                            Enable variant mode (if supported)
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || !selectedAttemptId}
                        >
                            {loading ? "Generating..." : "Generate Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
