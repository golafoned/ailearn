import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearning } from "../contexts/LearningContext";
import { RecommendationsPanel } from "../components/RecommendationsPanel";
import {
    StatCard,
    LevelBadge,
    StreakCounter,
    ConceptCard,
    MasteryProgressBar,
} from "../components/LearningComponents";

export function LearningDashboardPage() {
    const navigate = useNavigate();
    const {
        dashboardData,
        concepts,
        weakConcepts,
        dueReviews,
        loading,
        conceptsLoading,
        fetchConcepts,
        refreshDashboard,
    } = useLearning();

    const [conceptFilter, setConceptFilter] = useState("all");
    const [conceptSort, setConceptSort] = useState("mastery");

    useEffect(() => {
        refreshDashboard();
    }, [refreshDashboard]);

    useEffect(() => {
        fetchConcepts({ filter: conceptFilter, sort: conceptSort });
    }, [conceptFilter, conceptSort, fetchConcepts]);

    const handleCreateSession = () => {
        navigate("/learning/practice/create");
    };

    const handlePracticeConcept = (conceptName) => {
        navigate("/learning/practice/create", {
            state: { customConcepts: [conceptName] },
        });
    };

    const handleViewConcept = (conceptName) => {
        navigate(`/learning/concepts/${encodeURIComponent(conceptName)}`);
    };

    if (loading && !dashboardData) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">
                        Loading your learning dashboard...
                    </p>
                </div>
            </div>
        );
    }

    const dashboard = dashboardData || {};
    const level = dashboard.level || {};
    const dueData = dueReviews || {};

    return (
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        📚 Learning Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Track your progress and master concepts with adaptive
                        learning
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/learning/achievements")}
                        className="px-6 py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-all shadow-sm hover:shadow-md font-medium"
                    >
                        🏆 Achievements
                    </button>
                    <button
                        onClick={() => navigate("/learning/start")}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        🚀 Start Learning
                    </button>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <button
                    onClick={() => navigate("/learning/start")}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:shadow-md transition-all text-left"
                >
                    <span className="text-3xl">🎯</span>
                    <div>
                        <span className="font-semibold text-gray-900 block">
                            Learn New Topic
                        </span>
                        <span className="text-sm text-gray-500">
                            AI-generated practice on any subject
                        </span>
                    </div>
                </button>
                <button
                    onClick={() => navigate("/flashcards")}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-md transition-all text-left"
                >
                    <span className="text-3xl">🃏</span>
                    <div>
                        <span className="font-semibold text-gray-900 block">
                            Study Flashcards
                        </span>
                        <span className="text-sm text-gray-500">
                            Spaced repetition review
                        </span>
                    </div>
                </button>
                <button
                    onClick={handleCreateSession}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-md transition-all text-left"
                >
                    <span className="text-3xl">⚡</span>
                    <div>
                        <span className="font-semibold text-gray-900 block">
                            Quick Practice
                        </span>
                        <span className="text-sm text-gray-500">
                            Review due & weak concepts
                        </span>
                    </div>
                </button>
            </div>

            {/* Recommendations Panel */}
            <div className="mb-8">
                <RecommendationsPanel />
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon="🎯"
                    label="Overall Progress"
                    value={`${dashboard.overallProgress || 0}%`}
                    color="blue"
                />
                <StatCard
                    icon="✅"
                    label="Concepts Mastered"
                    value={dashboard.conceptsMastered || 0}
                    sublabel={`${dashboard.conceptsLearning || 0} in progress`}
                    color="green"
                />
                <StatCard
                    icon="⏰"
                    label="Due for Review"
                    value={dueData.dueCount || 0}
                    sublabel={
                        dueData.overdueCount > 0
                            ? `${dueData.overdueCount} overdue`
                            : "All caught up!"
                    }
                    color={dueData.overdueCount > 0 ? "orange" : "yellow"}
                />
                <StatCard
                    icon="📈"
                    label="This Week"
                    value={`+${dashboard.weeklyImprovement || 0}%`}
                    sublabel="Improvement"
                    color="purple"
                />
            </div>

            {/* Level & Streak Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Level Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Your Level
                    </h2>
                    <div className="flex items-center gap-6">
                        <LevelBadge
                            level={level.current || 1}
                            name={level.name || "Beginner"}
                            progress={level.progress || 0}
                            nextLevel={level.nextLevel}
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">
                                Progress to {level.nextLevel || "Next Level"}
                            </p>
                            <MasteryProgressBar
                                mastery={level.progress || 0}
                                showLabel={false}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                {level.conceptsForNextLevel || 0} more concepts
                                to level up
                            </p>
                        </div>
                    </div>
                </div>

                {/* Streak Card */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Practice Streak
                    </h2>
                    <div className="flex items-center justify-center">
                        <StreakCounter
                            currentStreak={dashboard.currentStreak || 0}
                            longestStreak={dashboard.longestStreak}
                        />
                    </div>
                    {dashboard.currentStreak === 0 && (
                        <p className="text-sm text-center text-gray-600 mt-4">
                            Start practicing today to begin your streak! 🚀
                        </p>
                    )}
                </div>
            </div>

            {/* Weak Concepts Alert */}
            {weakConcepts && weakConcepts.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">
                                Needs Attention
                            </h2>
                            <div className="space-y-2 mb-4">
                                {weakConcepts
                                    .slice(0, 3)
                                    .map((concept, idx) => (
                                        <div
                                            key={concept.name}
                                            className="flex items-center justify-between bg-white rounded-lg p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-bold text-gray-400">
                                                    {idx + 1}.
                                                </span>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {concept.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">
                                                        {concept.mastery}%
                                                        mastery •{" "}
                                                        {concept.successRate}%
                                                        success rate
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handlePracticeConcept(
                                                        concept.name,
                                                    )
                                                }
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                            >
                                                Practice
                                            </button>
                                        </div>
                                    ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigate("/learning/practice/create", {
                                            state: { conceptSelection: "weak" },
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Focused Practice
                                </button>
                                <button
                                    onClick={() => setConceptFilter("weak")}
                                    className="flex-1 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                >
                                    View Weak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Concepts Grid */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        Your Concepts
                    </h2>
                    <div className="flex gap-3">
                        <select
                            value={conceptFilter}
                            onChange={(e) => setConceptFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Concepts</option>
                            <option value="weak">Weak (&lt;40%)</option>
                            <option value="learning">Learning (40-80%)</option>
                            <option value="mastered">Mastered (≥80%)</option>
                            <option value="due">Due for Review</option>
                        </select>
                        <select
                            value={conceptSort}
                            onChange={(e) => setConceptSort(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="mastery">Sort by Mastery</option>
                            <option value="recent">Recently Practiced</option>
                            <option value="due">Due Date</option>
                            <option value="name">Alphabetical</option>
                        </select>
                    </div>
                </div>

                {conceptsLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm text-gray-600">
                            Loading concepts...
                        </p>
                    </div>
                ) : concepts && concepts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {concepts.map((concept) => (
                            <ConceptCard
                                key={concept.name}
                                concept={concept}
                                onPractice={() =>
                                    handlePracticeConcept(concept.name)
                                }
                                onClick={() => handleViewConcept(concept.name)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">
                            No concepts found with current filters
                        </p>
                        <button
                            onClick={() => setConceptFilter("all")}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            View all concepts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
