import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    MasteryProgressBar,
    ConceptTag,
} from "../components/LearningComponents";

export function SessionResultsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Results passed from TestTakingPage after completeSession
    const results = location.state?.results;

    if (!results) {
        // If no results, redirect to dashboard
        navigate("/learning");
        return null;
    }

    const {
        sessionId,
        score,
        questionsCorrect,
        questionsTotal,
        masteryChanges = [],
        nextRecommendation,
        achievementsEarned = [],
    } = results;

    const totalMasteryGain = masteryChanges.reduce(
        (sum, c) => sum + (c.change || 0),
        0
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
            {/* Success Header */}
            <div className="text-center mb-8">
                <div className="inline-block text-6xl mb-4 animate-bounce">
                    🎉
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Session Complete!
                </h1>
                <p className="text-gray-600">
                    Great work! Here's how you improved.
                </p>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 mb-6 shadow-lg">
                <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-blue-600 mb-2">
                        {score}%
                    </div>
                    <div className="text-lg text-gray-700">
                        {questionsCorrect} / {questionsTotal} correct
                    </div>
                </div>

                {totalMasteryGain > 0 ? (
                    <div className="flex items-center justify-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-lg">
                        <span className="text-2xl">📈</span>
                        <span className="font-bold">
                            +{totalMasteryGain} total mastery gained!
                        </span>
                    </div>
                ) : totalMasteryGain < 0 ? (
                    <div className="flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-6 py-3 rounded-lg">
                        <span className="text-2xl">📉</span>
                        <span className="font-bold">
                            Keep practicing to improve mastery
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg">
                        <span className="font-bold">Mastery maintained</span>
                    </div>
                )}
            </div>

            {/* Achievements Earned */}
            {achievementsEarned && achievementsEarned.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        New Achievements Unlocked!
                    </h2>
                    <div className="space-y-2">
                        {achievementsEarned.map((achievement, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-lg p-4 flex items-center gap-3"
                            >
                                <span className="text-3xl">🏅</span>
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {achievement.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {achievement.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mastery Changes */}
            {masteryChanges && masteryChanges.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        📊 Mastery Changes
                    </h2>
                    <div className="space-y-4">
                        {masteryChanges.map((change, idx) => {
                            const isImprovement = change.change > 0;
                            const isDecline = change.change < 0;

                            return (
                                <div
                                    key={idx}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <ConceptTag
                                            name={change.concept}
                                            mastery={change.after}
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">
                                                {change.before}%
                                            </span>
                                            <span
                                                className={`font-bold ${
                                                    isImprovement
                                                        ? "text-green-600"
                                                        : isDecline
                                                        ? "text-red-600"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                →
                                            </span>
                                            <span
                                                className={`text-lg font-bold ${
                                                    isImprovement
                                                        ? "text-green-600"
                                                        : isDecline
                                                        ? "text-red-600"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {change.after}%
                                            </span>
                                            <span
                                                className={`text-sm font-bold ${
                                                    isImprovement
                                                        ? "text-green-600"
                                                        : isDecline
                                                        ? "text-red-600"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                ({isImprovement ? "+" : ""}
                                                {change.change})
                                            </span>
                                        </div>
                                    </div>
                                    <MasteryProgressBar
                                        mastery={change.after}
                                        showLabel={false}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Next Recommendation */}
            {nextRecommendation && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl">💡</span>
                        What's Next?
                    </h2>
                    <p className="text-gray-700 mb-4">
                        {nextRecommendation.reason}
                    </p>
                    {nextRecommendation.concepts &&
                        nextRecommendation.concepts.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Recommended concepts:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {nextRecommendation.concepts.map(
                                        (concept, idx) => (
                                            <ConceptTag
                                                key={idx}
                                                name={concept}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    {nextRecommendation.suggestedDate && (
                        <p className="text-sm text-gray-600">
                            📅 Next review suggested:{" "}
                            <span className="font-semibold">
                                {new Date(
                                    nextRecommendation.suggestedDate
                                ).toLocaleDateString()}
                            </span>
                        </p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => navigate("/learning/practice/create")}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-bold text-lg"
                >
                    Practice Again
                </button>
                <button
                    onClick={() => navigate("/learning")}
                    className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-lg"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Session ID (for debugging) */}
            {sessionId && (
                <p className="text-center text-xs text-gray-400 mt-6">
                    Session ID: {sessionId}
                </p>
            )}
        </div>
    );
}
