import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearning } from "../contexts/LearningContext";
import {
    LevelBadge,
    MasteryProgressBar,
} from "../components/LearningComponents";

const CATEGORIES = [
    { key: "all", label: "All" },
    { key: "streaks", label: "🔥 Streaks" },
    { key: "mastery", label: "📚 Mastery" },
    { key: "sessions", label: "🎯 Sessions" },
    { key: "perfect_scores", label: "💯 Perfect Scores" },
    { key: "flashcards", label: "🃏 Flashcards" },
];

export function AchievementsPage() {
    const navigate = useNavigate();
    const { achievements, loading, fetchAchievements } = useLearning();
    const [activeCategory, setActiveCategory] = useState("all");

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    if (loading && !achievements) {
        return (
            <div className="max-w-7xl mx-auto page-shell">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading achievements...</p>
                </div>
            </div>
        );
    }

    const level = achievements?.level || {};
    const earned = achievements?.earned || [];
    const inProgress = achievements?.inProgress || [];

    const filterByCategory = (items) =>
        activeCategory === "all"
            ? items
            : items.filter((a) => a.category === activeCategory);

    const filteredEarned = filterByCategory(earned);
    const filteredInProgress = filterByCategory(inProgress);

    return (
        <div className="max-w-6xl mx-auto page-shell">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate("/learning")}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                    ← Back
                </button>
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">
                        🏆 Achievements
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {achievements?.totalEarned || 0} /{" "}
                        {achievements?.totalAvailable || 0} earned
                    </p>
                </div>
            </div>

            {/* Level Display */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Your Level
                </h2>
                <div className="flex flex-col items-center">
                    <LevelBadge
                        level={level.current || 1}
                        name={level.name || "Beginner"}
                        progress={level.progress || 0}
                        nextLevel={level.nextLevel}
                    />
                    <div className="w-full max-w-md mt-6">
                        <p className="text-sm text-gray-600 mb-2 text-center">
                            {level.conceptsEarned || 0} /{" "}
                            {level.conceptsRequired || 0} concepts to next level
                        </p>
                        <MasteryProgressBar
                            mastery={
                                level.conceptsRequired
                                    ? ((level.conceptsEarned % 5) / 5) * 100
                                    : 0
                            }
                            showLabel={false}
                        />
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8 overflow-x-auto">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`flex-1 min-w-fit px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                            activeCategory === cat.key
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Earned Achievements */}
            {filteredEarned.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        ✅ Earned ({filteredEarned.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEarned.map((achievement) => (
                            <div
                                key={achievement.name}
                                className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-sm"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-3xl">
                                        {achievement.icon || "🏅"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {achievement.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full w-fit">
                                    <span className="font-bold">✓ Earned</span>
                                    <span>•</span>
                                    <span>
                                        {achievement.earnedAt
                                            ? new Date(
                                                  achievement.earnedAt,
                                              ).toLocaleDateString()
                                            : "Recently"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* In Progress + Locked Achievements */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    🎯 In Progress ({filteredInProgress.length})
                </h2>
                {filteredInProgress.length > 0 ? (
                    <div className="space-y-3">
                        {filteredInProgress.map((achievement) => (
                            <div
                                key={achievement.name}
                                className={`rounded-xl p-5 border-2 ${
                                    achievement.progress > 0
                                        ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                                        : "border-gray-200 bg-gray-50"
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span
                                        className={`text-2xl ${achievement.progress === 0 ? "opacity-40 grayscale" : ""}`}
                                    >
                                        {achievement.icon || "🏅"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {achievement.description}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-lg font-bold text-blue-600">
                                            {achievement.progress || 0}
                                            <span className="text-sm text-gray-400 font-normal">
                                                {" "}
                                                / {achievement.progress_total}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                            achievement.progress > 0
                                                ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                                                : "bg-gray-300"
                                        }`}
                                        style={{
                                            width: `${achievement.percentage || 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500">
                            {activeCategory === "all"
                                ? "All achievements earned! 🎉"
                                : "No achievements in this category yet"}
                        </p>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="text-center">
                <button
                    onClick={() => navigate("/learning/start")}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-bold text-lg"
                >
                    Start Learning to Earn More! 🚀
                </button>
            </div>
        </div>
    );
}
