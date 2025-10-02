import React, { useEffect, useState } from "react";
import { useTestData } from "../contexts/TestDataContext";

export function Leaderboard({ testId, limit = 10, showTitle = true }) {
    const { leaderboard, fetchLeaderboard, loading } = useTestData();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (testId) {
            fetchLeaderboard(testId, limit).catch(() => {
                setError("Failed to load leaderboard");
            });
        }
    }, [testId, limit, fetchLeaderboard]);

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mb-2"></div>
                <p className="text-sm text-gray-500">Loading leaderboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm text-gray-600">No scores yet</p>
                <p className="text-xs text-gray-500 mt-1">
                    Be the first to complete this test!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {showTitle && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 border-b border-yellow-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        Leaderboard
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                        Top {limit} performers
                    </p>
                </div>
            )}
            <div className="divide-y divide-gray-100">
                {leaderboard.map((entry, index) => {
                    const medal =
                        index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : null;
                    const isTopThree = index < 3;

                    return (
                        <div
                            key={entry.attemptId}
                            className={`p-4 flex items-center justify-between transition-colors ${
                                isTopThree
                                    ? "bg-gradient-to-r from-yellow-50 to-transparent hover:from-yellow-100"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div
                                    className={`text-center w-10 ${
                                        isTopThree
                                            ? "text-xl"
                                            : "text-sm text-gray-500 font-semibold"
                                    }`}
                                >
                                    {medal || `#${index + 1}`}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`font-semibold truncate ${
                                            isTopThree
                                                ? "text-gray-900"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {entry.displayName ||
                                            entry.participantName ||
                                            "Anonymous"}
                                    </p>
                                    {entry.displayName &&
                                        entry.participantName && (
                                            <p className="text-xs text-gray-500 truncate">
                                                @{entry.participantName}
                                            </p>
                                        )}
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(
                                            entry.submittedAt
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div
                                    className={`text-2xl font-bold ${
                                        entry.score >= 90
                                            ? "text-green-600"
                                            : entry.score >= 70
                                            ? "text-blue-600"
                                            : "text-yellow-600"
                                    }`}
                                >
                                    {entry.score}%
                                </div>
                                {isTopThree && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {entry.score >= 95
                                            ? "Perfect!"
                                            : entry.score >= 80
                                            ? "Excellent"
                                            : "Great"}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {leaderboard.length >= limit && (
                <div className="p-3 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">
                        Showing top {limit} • {leaderboard.length} total
                    </p>
                </div>
            )}
        </div>
    );
}
