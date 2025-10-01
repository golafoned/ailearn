import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../components/Button";
import { IconClock, IconCalendar } from "../components/Icons";
import { useTestData } from "../contexts/TestDataContext";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
    const {
        myAttempts,
        fetchMyAttempts,
        loading,
        tests,
        fetchMyTests,
        testsPageInfo,
    } = useTestData();
    const [activeTab, setActiveTab] = useState("myTests");
    // inline attempts removed; use dedicated analytics page
    const navigate = useNavigate();

    // For now we only have attempts (no list my tests endpoint yet)
    // Could fetch on mount when switching to results tab
    const loadAttempts = () => fetchMyAttempts().catch(() => {});

    useEffect(() => {
        if (activeTab === "myTests" && tests.length === 0) {
            fetchMyTests({ page: 1, pageSize: 10 }).catch(() => {});
        }
        if (activeTab === "myResults" && myAttempts.length === 0) {
            // also fetch first page of my tests so we can map titles
            fetchMyTests({ page: 1, pageSize: 10 }).catch(() => {});
            fetchMyAttempts().catch(() => {});
        }
    }, [
        activeTab,
        tests.length,
        myAttempts.length,
        fetchMyTests,
        fetchMyAttempts,
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
            <div className="mb-8 border-b border-gray-200">
                <nav className="flex space-x-2" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("myTests")}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                            activeTab === "myTests"
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        My Tests
                    </button>
                    <button
                        onClick={() => setActiveTab("myResults")}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                            activeTab === "myResults"
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        My Results
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
                        <p className="text-sm text-gray-500">
                            No tests yet. Generate your first one.
                        </p>
                    )}
                    <ul className="divide-y divide-gray-200">
                        {tests.map((t) => (
                            <li
                                key={t.id}
                                className="py-3 text-sm flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 rounded-md transition"
                                onClick={() => openTestAttempts(t)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {t.title}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        {t.code}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <p>
                                        Expires:{" "}
                                        {new Date(
                                            t.expiresAt
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {testsPageInfo.page < testsPageInfo.totalPages && (
                        <div className="mt-4 text-center">
                            <Button
                                variant="secondary"
                                onClick={loadMoreTests}
                                disabled={loading}
                            >
                                {loading ? "Loading..." : "Load More"}
                            </Button>
                        </div>
                    )}
                    {/* Attempts moved to dedicated analytics page */}
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
                        <p className="text-sm text-gray-500">
                            No attempts yet.
                        </p>
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
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() =>
                                                navigate(`/attempts/${a.id}`)
                                            }
                                            aria-label={`Open attempt ${a.id}`}
                                        >
                                            <td className="py-2 pr-4">
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
                                            <td className="py-2 pr-4 text-xs text-gray-600">
                                                {a.startedAt
                                                    ? new Date(
                                                          a.startedAt
                                                      ).toLocaleString()
                                                    : "—"}
                                            </td>
                                            <td className="py-2 pr-4 font-semibold">
                                                {a.score == null
                                                    ? "—"
                                                    : `${a.score}%`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
