import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { ApiError } from "../utils/apiClient";

export function TestAnalyticsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTestById, fetchAttemptsForTest, attemptsForTest } =
        useTestData();
    const [testMeta, setTestMeta] = useState(() => getTestById(id));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Ensure we have test meta (title, code, expires) - if not in list fetch attempts first won't include meta, so fetch from /mine list is assumed done previously. If missing, do lightweight fetch via code not available -> skipping; fallback title.

    const loadedRef = useRef(false);
    const loadOnce = useCallback(async () => {
        if (!id || loadedRef.current) return;
        loadedRef.current = true; // set immediately to prevent race causing duplicate fetches
        let active = true;
        setLoading(true);
        setError(null);
        try {
            await fetchAttemptsForTest(id);
            if (!testMeta)
                setTestMeta(getTestById(id) || { id, title: "Test" });
        } catch (e) {
            if (active)
                setError(
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load attempts"
                );
        } finally {
            if (active) setLoading(false);
        }
        return () => {
            active = false;
        };
    }, [id, fetchAttemptsForTest, getTestById, testMeta]);

    useEffect(() => {
        loadOnce();
    }, [loadOnce]);

    const manualRefresh = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            await fetchAttemptsForTest(id);
        } catch (e) {
            setError(
                e instanceof ApiError ? e.message : "Failed to load attempts"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
            <button
                onClick={() => navigate("/dashboard")}
                className="text-blue-600 hover:underline mb-6"
            >
                &larr; Back to Dashboard
            </button>
            <div className="flex items-start justify-between mb-2 gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold">
                    {testMeta?.title || "Test"}
                </h1>
                <button
                    onClick={manualRefresh}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <p className="text-gray-500 mb-6 text-sm">
                Attempts for this test.
            </p>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-900">
                                Participant
                            </th>
                            <th className="px-6 py-3 font-medium text-gray-900">
                                Started
                            </th>
                            <th className="px-6 py-3 font-medium text-gray-900">
                                Submitted
                            </th>
                            <th className="px-6 py-3 font-medium text-gray-900 text-right">
                                Score
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-6 text-center text-gray-500"
                                >
                                    Loading...
                                </td>
                            </tr>
                        )}
                        {!loading && attemptsForTest.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-6 text-center text-gray-500"
                                >
                                    No attempts yet.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            attemptsForTest.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {a.displayName ||
                                            a.participantName ||
                                            "Participant"}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-600">
                                        {a.startedAt
                                            ? new Date(
                                                  a.startedAt
                                              ).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-600">
                                        {a.submittedAt
                                            ? new Date(
                                                  a.submittedAt
                                              ).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-3 font-semibold text-right">
                                        {a.score == null ? "—" : `${a.score}%`}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
