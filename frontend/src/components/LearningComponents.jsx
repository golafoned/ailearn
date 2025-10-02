import React from "react";

export function MasteryProgressBar({
    mastery,
    size = "default",
    showLabel = true,
}) {
    const percentage = Math.max(0, Math.min(100, mastery || 0));

    // Color based on mastery level
    const getColor = () => {
        if (percentage >= 80) return "bg-green-500";
        if (percentage >= 60) return "bg-blue-500";
        if (percentage >= 40) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getBgColor = () => {
        if (percentage >= 80) return "bg-green-100";
        if (percentage >= 60) return "bg-blue-100";
        if (percentage >= 40) return "bg-yellow-100";
        return "bg-red-100";
    };

    const height =
        size === "small" ? "h-1.5" : size === "large" ? "h-4" : "h-2.5";

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">
                        Mastery
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                        {percentage}%
                    </span>
                </div>
            )}
            <div
                className={`w-full ${height} ${getBgColor()} rounded-full overflow-hidden`}
            >
                <div
                    className={`${height} ${getColor()} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export function ConceptTag({ name, mastery, onClick, removable, onRemove }) {
    const getColor = () => {
        if (!mastery) return "bg-gray-100 text-gray-700";
        if (mastery >= 80) return "bg-green-100 text-green-700";
        if (mastery >= 60) return "bg-blue-100 text-blue-700";
        if (mastery >= 40) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColor()} ${
                onClick
                    ? "cursor-pointer hover:shadow-sm transition-shadow"
                    : ""
            }`}
            onClick={onClick}
        >
            {name}
            {mastery !== undefined && mastery !== null && (
                <span className="text-xs opacity-75">({mastery}%)</span>
            )}
            {removable && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                    ×
                </button>
            )}
        </span>
    );
}

export function DifficultyIndicator({ difficulty, size = "default" }) {
    const colors = {
        easy: "bg-green-100 text-green-700 border-green-300",
        medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
        hard: "bg-red-100 text-red-700 border-red-300",
    };

    const icons = {
        easy: "🟢",
        medium: "🟡",
        hard: "🔴",
    };

    const sizeClasses =
        size === "small" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

    return (
        <span
            className={`inline-flex items-center gap-1 ${sizeClasses} rounded-full font-semibold border ${
                colors[difficulty] || colors.medium
            }`}
        >
            <span>{icons[difficulty] || icons.medium}</span>
            <span className="capitalize">{difficulty || "Medium"}</span>
        </span>
    );
}

export function StreakCounter({ currentStreak, longestStreak }) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                    <div className="text-2xl font-bold text-orange-600">
                        {currentStreak || 0}
                    </div>
                    <div className="text-xs text-gray-600">Day Streak</div>
                </div>
            </div>
            {longestStreak && longestStreak > currentStreak && (
                <div className="flex items-center gap-2 opacity-60">
                    <span className="text-xl">🏆</span>
                    <div>
                        <div className="text-lg font-semibold text-gray-700">
                            {longestStreak}
                        </div>
                        <div className="text-xs text-gray-500">Best</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function LevelBadge({ level, name, progress, nextLevel }) {
    const levelColors = {
        1: "from-gray-400 to-gray-500",
        2: "from-green-400 to-green-500",
        3: "from-blue-400 to-blue-500",
        4: "from-purple-400 to-purple-500",
        5: "from-yellow-400 to-yellow-500",
        6: "from-red-400 to-red-500",
    };

    const gradient = levelColors[level] || levelColors[1];

    return (
        <div className="inline-flex flex-col items-center">
            <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
            >
                <span className="text-2xl font-bold text-white">{level}</span>
            </div>
            <div className="mt-2 text-center">
                <div className="text-sm font-bold text-gray-900">{name}</div>
                {nextLevel && (
                    <div className="text-xs text-gray-500 mt-1">
                        {progress}% to {nextLevel}
                    </div>
                )}
            </div>
        </div>
    );
}

export function StatCard({ icon, label, value, sublabel, color = "blue" }) {
    const colorClasses = {
        blue: "from-blue-50 to-indigo-50 border-blue-200",
        green: "from-green-50 to-emerald-50 border-green-200",
        purple: "from-purple-50 to-pink-50 border-purple-200",
        orange: "from-orange-50 to-red-50 border-orange-200",
        yellow: "from-yellow-50 to-amber-50 border-yellow-200",
    };

    return (
        <div
            className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4 shadow-sm`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-sm font-medium text-gray-600">{label}</div>
            {sublabel && (
                <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
            )}
        </div>
    );
}

export function ConceptCard({ concept, onPractice, onClick }) {
    const {
        name,
        category,
        mastery,
        lastPracticed,
        nextDue,
        isDue,
        isOverdue,
        totalAttempts,
    } = concept;

    const getBorderColor = () => {
        if (isOverdue) return "border-red-300";
        if (isDue) return "border-yellow-300";
        if (mastery >= 80) return "border-green-300";
        return "border-gray-200";
    };

    const getStatusBadge = () => {
        if (isOverdue)
            return (
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                    Overdue!
                </span>
            );
        if (isDue)
            return (
                <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                    Due
                </span>
            );
        if (mastery >= 80)
            return (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                    ✓ Mastered
                </span>
            );
        return null;
    };

    return (
        <div
            className={`border-2 ${getBorderColor()} rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all ${
                onClick ? "cursor-pointer" : ""
            }`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {name}
                    </h3>
                    {category && (
                        <p className="text-xs text-gray-500">{category}</p>
                    )}
                </div>
                {getStatusBadge()}
            </div>

            <MasteryProgressBar
                mastery={mastery}
                size="default"
                showLabel={true}
            />

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                    <span className="font-medium">Last practiced:</span>
                    <div className="text-gray-800">
                        {lastPracticed
                            ? new Date(lastPracticed).toLocaleDateString()
                            : "Never"}
                    </div>
                </div>
                <div>
                    <span className="font-medium">Attempts:</span>
                    <div className="text-gray-800 font-semibold">
                        {totalAttempts || 0}
                    </div>
                </div>
            </div>

            {nextDue && (
                <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Next review:</span>
                    <div className="text-gray-800">
                        {new Date(nextDue).toLocaleDateString()}
                    </div>
                </div>
            )}

            {onPractice && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPractice();
                    }}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                    Practice Now
                </button>
            )}
        </div>
    );
}
