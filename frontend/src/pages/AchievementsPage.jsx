import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLearning } from "../contexts/LearningContext";
import {
    LevelBadge,
    MasteryProgressBar,
} from "../components/LearningComponents";

export function AchievementsPage() {
    const navigate = useNavigate();
    const { achievements, loading, fetchAchievements } = useLearning();

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    if (loading && !achievements) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading achievements...</p>
                </div>
            </div>
        );
    }

    const achievementIcons = {
        streak_7: "🔥",
        streak_30: "🔥",
        concepts_10: "📚",
        concepts_50: "📚",
        concepts_100: "📚",
        perfect_10: "💯",
        speed_demon: "⚡",
        night_owl: "🦉",
        early_bird: "🐦",
    };

    const level = achievements?.level || {};
    const earned = achievements?.earned || [];
    const inProgress = achievements?.inProgress || [];

    return (
        <div className="max-w-6xl mx-auto px-4 py-24 sm:py-32">
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
                        Your badges, milestones, and progress
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
                            {level.conceptsRequired || 0} concepts mastered
                        </p>
                        <MasteryProgressBar
                            mastery={
                                (level.conceptsEarned /
                                    level.conceptsRequired) *
                                    100 || 0
                            }
                            showLabel={false}
                        />
                    </div>
                </div>
            </div>

            {/* Earned Achievements */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    ✅ Earned Badges
                </h2>
                {earned.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {earned.map((achievement) => (
                            <div
                                key={achievement.name}
                                className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-4xl">
                                        {achievementIcons[
                                            achievement.achievement_type
                                        ] || "🏅"}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {achievement.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                                    <span className="font-bold">✓ Earned</span>
                                    <span>•</span>
                                    <span>
                                        {achievement.earnedAt
                                            ? new Date(
                                                  achievement.earnedAt
                                              ).toLocaleDateString()
                                            : "Recently"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <span className="text-6xl mb-4 block">🎯</span>
                        <p className="text-gray-600 mb-2">
                            No achievements earned yet
                        </p>
                        <p className="text-sm text-gray-500">
                            Keep practicing to earn your first badge!
                        </p>
                    </div>
                )}
            </div>

            {/* In Progress Achievements */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    🎯 In Progress
                </h2>
                {inProgress.length > 0 ? (
                    <div className="space-y-4">
                        {inProgress.map((achievement) => (
                            <div
                                key={achievement.name}
                                className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6"
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="text-3xl">
                                        {achievementIcons[
                                            achievement.achievement_type
                                        ] || "🏅"}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {achievement.description}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {achievement.progress || 0}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            / {achievement.progress_total || 0}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-medium text-gray-600">
                                            Progress
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">
                                            {achievement.percentage || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${
                                                    achievement.percentage || 0
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">
                            All available achievements either earned or not yet
                            started
                        </p>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
                <button
                    onClick={() => navigate("/learning/practice/create")}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-bold text-lg"
                >
                    Start Practicing to Earn More! 🚀
                </button>
            </div>
        </div>
    );
}
