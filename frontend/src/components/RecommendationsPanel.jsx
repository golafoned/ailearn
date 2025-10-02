import React, { useEffect, useState } from "react";
import { useTestData } from "../contexts/TestDataContext";
import { ApiError } from "../utils/apiClient";

export function RecommendationsPanel() {
    const { recommendations, fetchRecommendations } = useTestData();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchRecommendations();
            } catch (e) {
                setError(
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load recommendations"
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [fetchRecommendations]);

    // Sort recommendations by weight (descending)
    const sortedRecommendations = [...recommendations].sort(
        (a, b) => (b.weight || 0) - (a.weight || 0)
    );

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Practice Recommendations
                </h3>
                <p className="text-sm text-gray-500">
                    Loading recommendations...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Practice Recommendations
                </h3>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        );
    }

    if (sortedRecommendations.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 Practice Recommendations
                </h3>
                <p className="text-sm text-gray-600">
                    Complete some tests to get personalized practice
                    recommendations.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Practice Recommendations
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Based on your recent performance, consider reviewing these
                topics:
            </p>

            <div className="flex flex-wrap gap-2">
                {sortedRecommendations.map((rec, idx) => {
                    const weight = rec.weight || 0;
                    const priority =
                        weight >= 0.7
                            ? "high"
                            : weight >= 0.4
                            ? "medium"
                            : "low";

                    const colors = {
                        high: "bg-red-100 border-red-300 text-red-800",
                        medium: "bg-yellow-100 border-yellow-300 text-yellow-800",
                        low: "bg-blue-100 border-blue-300 text-blue-800",
                    };

                    return (
                        <div
                            key={idx}
                            className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${colors[priority]} cursor-help transition-transform hover:scale-105`}
                            title={rec.suggestion || "Review this topic"}
                        >
                            <span>{rec.topic}</span>
                            {weight > 0 && (
                                <span className="text-xs opacity-75">
                                    {Math.round(weight * 100)}%
                                </span>
                            )}

                            {/* Tooltip on hover */}
                            {rec.suggestion && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <p className="font-semibold mb-1">
                                        💡 Suggestion:
                                    </p>
                                    <p>{rec.suggestion}</p>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span>
                    High priority
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 ml-3 mr-1"></span>
                    Medium priority
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 ml-3 mr-1"></span>
                    Low priority
                </p>
            </div>
        </div>
    );
}
