import React, { useState } from "react";
import { Button } from "../components/Button";
import { IconClock, IconCalendar } from "../components/Icons";
import { useTestData } from "../contexts/TestDataContext";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
    const { myAttempts, fetchMyAttempts, loading } = useTestData();
    const [activeTab, setActiveTab] = useState("myTests");
    const navigate = useNavigate();

    // For now we only have attempts (no list my tests endpoint yet)
    // Could fetch on mount when switching to results tab
    const loadAttempts = () => fetchMyAttempts().catch(() => {});

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
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                        No test listing endpoint yet
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Generate a test and share its code immediately after
                        creation.
                    </p>
                    <Button onClick={() => navigate("/create")}>
                        Generate a Test
                    </Button>
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
                        <ul className="divide-y divide-gray-200">
                            {myAttempts.map((a) => (
                                <li
                                    key={a.id}
                                    className="py-3 text-sm flex justify-between"
                                >
                                    <span className="font-mono">
                                        {a.id.slice(0, 8)}...
                                    </span>
                                    <span>
                                        {a.score == null ? "—" : `${a.score}%`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
