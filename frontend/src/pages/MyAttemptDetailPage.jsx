import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { ApiError } from "../utils/apiClient";

// Participant view of their own attempt detail
export function MyAttemptDetailPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { fetchAttemptDetail, attemptDetail } = useTestData();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
            <button
                onClick={() => navigate("/dashboard")}
                className="text-blue-600 hover:underline mb-6"
            >
                &larr; Back to Dashboard
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Attempt</h1>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {loading && (
                <p className="text-sm text-gray-500 mb-4">Loading...</p>
            )}
            {detail && (
                <div className="mb-6 text-sm text-gray-600">
                    <p>
                        Test Code:{" "}
                        <span className="font-mono">
                            {detail.testCode || detail.code || ""}
                        </span>
                    </p>
                    <p>
                        Submitted:{" "}
                        {detail.submittedAt
                            ? new Date(detail.submittedAt).toLocaleString()
                            : "—"}
                    </p>
                    <p>
                        Score: {detail.score == null ? "—" : `${detail.score}%`}
                    </p>
                </div>
            )}
            <div className="space-y-6">
                {answerItems.map((a, idx) => {
                    const chosen = a.userAnswer ?? a.answer;
                    const correct = a.correctAnswer; // might be redacted for participant depending on backend rules
                    const isCorrect =
                        typeof a.isCorrect === "boolean"
                            ? a.isCorrect
                            : chosen != null &&
                              correct != null &&
                              chosen === correct;
                    return (
                        <div
                            key={a.questionId || idx}
                            className={`border rounded-lg p-4 bg-white shadow-sm ${
                                isCorrect
                                    ? "border-green-300"
                                    : chosen != null
                                    ? "border-red-300"
                                    : "border-gray-200"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="font-semibold text-gray-900">
                                    Q{idx + 1}.{" "}
                                    {a.question || a.prompt || "Question"}
                                </h2>
                                <span
                                    className={`text-xs font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                        isCorrect
                                            ? "bg-green-100 text-green-700"
                                            : chosen != null
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                    {isCorrect && <span>✅</span>}
                                    {!isCorrect && chosen != null && (
                                        <span>❌</span>
                                    )}
                                    {isCorrect
                                        ? "Correct"
                                        : chosen != null
                                        ? "Incorrect"
                                        : "Unanswered"}
                                </span>
                            </div>
                            <div className="mt-2 text-sm flex flex-col gap-1">
                                <p>
                                    Your answer:{" "}
                                    {chosen == null ? (
                                        <em className="text-gray-500">—</em>
                                    ) : (
                                        <span className="font-medium">
                                            {chosen}
                                        </span>
                                    )}
                                </p>
                                {correct != null && (
                                    <p className="text-xs text-green-700">
                                        Correct answer: {correct}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
                {!loading && answerItems.length === 0 && (
                    <p className="text-sm text-gray-500">
                        No answers available.
                    </p>
                )}
            </div>
        </div>
    );
}
