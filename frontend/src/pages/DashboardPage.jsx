import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../components/Button";
import { IconClock, IconCalendar } from "../components/Icons";
import { useTestData } from "../contexts/TestDataContext";
import { useNavigate } from "react-router-dom";
import { RecommendationsPanel } from "../components/RecommendationsPanel";
import { useToast } from "../contexts/ToastContext";

export function DashboardPage() {
    const {
        myAttempts,
        fetchMyAttempts,
        loading,
        tests,
        fetchMyTests,
        testsPageInfo,
        reviewTests,
        fetchReviewTests,
        closeTest,
    } = useTestData();
    const [activeTab, setActiveTab] = useState("myTests");
    const [closingTestId, setClosingTestId] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    const loadAttempts = () => fetchMyAttempts().catch(() => {});
    const loadReviewTests = () => fetchReviewTests().catch(() => {});

    useEffect(() => {
        if (activeTab === "myTests" && tests.length === 0) {
            fetchMyTests({ page: 1, pageSize: 10 }).catch(() => {});
        }
        if (activeTab === "myResults" && myAttempts.length === 0) {
            fetchMyTests({ page: 1, pageSize: 10 }).catch(() => {});
            fetchMyAttempts().catch(() => {});
        }
        if (activeTab === "reviewTests" && reviewTests.length === 0) {
            fetchReviewTests().catch(() => {});
        }
    }, [
        activeTab,
        tests.length,
        myAttempts.length,
        reviewTests.length,
        fetchMyTests,
        fetchMyAttempts,
        fetchReviewTests,
    ]);

    const testTitleMap = useMemo(() => {
        const map = {};
        tests.forEach((t) => {
            map[t.id] = t.title;
        });
        return map;
    }, [tests]);

    const openTestAttempts = (t) => {
        navigate(`/tests/${t.id}/analytics`);
    };

    const handleCloseTest = async (testId, e) => {
        e.stopPropagation();
        if (
            !confirm(
                "Are you sure you want to close this test? No new attempts will be allowed."
            )
        ) {
            return;
        }
        setClosingTestId(testId);
        try {
            await closeTest(testId);
            toast.success("Test closed successfully");
            // Refresh the tests list
            await fetchMyTests({ page: 1, pageSize: 10 });
        } catch {
            toast.error("Failed to close test");
        } finally {
            setClosingTestId(null);
        }
    };

    const loadMoreTests = () => {
        if (testsPageInfo.page < testsPageInfo.totalPages) {
            fetchMyTests({
                page: testsPageInfo.page + 1,
                pageSize: testsPageInfo.pageSize,
                append: true,
            }).catch(() => {});
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold">
                    Your Dashboard
                </h1>
                <Button onClick={() => navigate("/create")}>
                    Create New Test
                </Button>
            </div>
            {/* Recommendations Panel */}
            <div className="mb-8">
                <RecommendationsPanel />
            </div>

            <div className="mb-8 border-b border-gray-200">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("myTests")}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                            activeTab === "myTests"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        📚 My Tests
                    </button>
                    <button
                        onClick={() => setActiveTab("myResults")}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                            activeTab === "myResults"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        📊 My Attempts
                    </button>
                    <button
                        onClick={() => setActiveTab("reviewTests")}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-all ${
                            activeTab === "reviewTests"
                                ? "bg-purple-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                        📝 Review Tests
                    </button>
                </nav>
            </div>
            {activeTab === "myTests" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">My Tests</h2>
                        <Button
                            variant="secondary"
                            onClick={() =>
                                fetchMyTests({ page: 1, pageSize: 10 })
                            }
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                    {tests.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-gray-600 mb-2">
                                No tests created yet
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Create your first test to share with others
                            </p>
                            <Button onClick={() => navigate("/create")}>
                                Create New Test
                            </Button>
                        </div>
                    )}
                    {loading && tests.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-sm text-gray-500">
                                Loading your tests...
                            </p>
                        </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tests.map((t) => {
                            const isExpired =
                                new Date(t.expiresAt) < new Date();
                            const isClosed =
                                t.closedAt && new Date(t.closedAt) < new Date();
                            return (
                                <div
                                    key={t.id}
                                    className={`border-2 rounded-xl p-5 transition-all hover:shadow-lg ${
                                        isExpired || isClosed
                                            ? "border-gray-300 bg-gray-50"
                                            : "border-blue-200 bg-gradient-to-br from-white to-blue-50"
                                    }`}
                                >
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                                                    isExpired || isClosed
                                                        ? "bg-gray-200 text-gray-600"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}
                                            >
                                                {isClosed
                                                    ? "🔒 CLOSED"
                                                    : isExpired
                                                    ? "⏰ EXPIRED"
                                                    : "✅ ACTIVE"}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(
                                                        t.code
                                                    );
                                                    alert(
                                                        `Code ${t.code} copied!`
                                                    );
                                                }}
                                                className="text-xs text-gray-500 hover:text-blue-600 font-mono font-bold"
                                                title="Click to copy code"
                                            >
                                                {t.code}
                                            </button>
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                                            {t.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 text-xs text-gray-600 mb-4 bg-white/50 rounded-lg p-3 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span>📅 Created:</span>
                                            <span className="font-medium">
                                                {new Date(
                                                    t.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>⏰ Expires:</span>
                                            <span className="font-medium">
                                                {new Date(
                                                    t.expiresAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>👥 Attempts:</span>
                                            <span className="font-medium">
                                                {t.attemptCount || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openTestAttempts(t)}
                                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                                        >
                                            📊 Analytics
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const url = `${window.location.origin}/test/${t.code}`;
                                                navigator.clipboard.writeText(
                                                    url
                                                );
                                                toast.success(
                                                    "Test link copied!"
                                                );
                                            }}
                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                            title="Share test"
                                        >
                                            🔗
                                        </button>
                                        {!isExpired && !isClosed && (
                                            <button
                                                onClick={(e) =>
                                                    handleCloseTest(t.id, e)
                                                }
                                                disabled={
                                                    closingTestId === t.id
                                                }
                                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
                                                title="Close test"
                                            >
                                                {closingTestId === t.id
                                                    ? "..."
                                                    : "🔒"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {testsPageInfo.page < testsPageInfo.totalPages && (
                        <div className="mt-6 text-center">
                            <Button
                                variant="secondary"
                                onClick={loadMoreTests}
                                disabled={loading}
                            >
                                {loading ? "Loading..." : "Load More"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
            {activeTab === "myResults" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">My Attempts</h2>
                        <Button
                            variant="secondary"
                            onClick={loadAttempts}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                    {myAttempts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-gray-600 mb-2">
                                No attempts yet
                            </p>
                            <p className="text-sm text-gray-500">
                                Take a test to see your results here
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2 pr-4">Test</th>
                                        <th className="py-2 pr-4">Started</th>
                                        <th className="py-2 pr-4">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {myAttempts.map((a) => (
                                        <tr
                                            key={a.id}
                                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                                            onClick={() =>
                                                navigate(`/attempts/${a.id}`)
                                            }
                                            aria-label={`Open attempt ${a.id}`}
                                        >
                                            <td className="py-3 pr-4">
                                                <div className="font-medium text-gray-900 truncate max-w-[220px]">
                                                    {a.testTitle ||
                                                        testTitleMap[
                                                            a.testId
                                                        ] ||
                                                        "Test"}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    {a.testCode ||
                                                        a.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-gray-600">
                                                {a.startedAt
                                                    ? new Date(
                                                          a.startedAt
                                                      ).toLocaleString()
                                                    : "—"}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span
                                                    className={`font-bold text-sm ${
                                                        a.score >= 80
                                                            ? "text-green-600"
                                                            : a.score >= 60
                                                            ? "text-yellow-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {a.score == null
                                                        ? "—"
                                                        : `${a.score}%`}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "reviewTests" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold">
                                Review Tests
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Practice tests generated from your wrong answers
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={loadReviewTests}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>

                    {reviewTests.length === 0 && !loading ? (
                        <div className="text-center py-12 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No review tests yet
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                                Complete a test and generate a review from your
                                wrong answers to start practicing and improving
                                your knowledge.
                            </p>
                            <Button onClick={() => setActiveTab("myResults")}>
                                View My Attempts
                            </Button>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                Loading review tests...
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {reviewTests.map((test) => (
                                <div
                                    key={test.id}
                                    className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() =>
                                        navigate(`/review-tests/${test.code}`)
                                    }
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                                            REVIEW
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {test.code}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Strategy:
                                            </span>
                                            <span className="font-medium capitalize">
                                                {test.strategy?.replace(
                                                    /_/g,
                                                    " "
                                                ) || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Questions:
                                            </span>
                                            <span className="font-bold text-purple-700">
                                                {test.questionCount || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Created:
                                            </span>
                                            <span className="text-xs">
                                                {test.createdAt
                                                    ? new Date(
                                                          test.createdAt
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/review-tests/${test.code}`
                                            );
                                        }}
                                    >
                                        Start Review
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
