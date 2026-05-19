import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLearning } from "../contexts/LearningContext";
import {
    MasteryProgressBar,
    ConceptTag,
} from "../components/LearningComponents";

export function ConceptDetailPage() {
    const { name } = useParams();
    const navigate = useNavigate();
    const {
        fetchConceptDetails,
        conceptDetails,
        fetchProgressChart,
        progressChart,
        fetchConceptAttempts,
        conceptAttempts,
        conceptAttemptsLoading,
        ensureConceptAttempt,
    } = useLearning();
    const [period, setPeriod] = useState("month");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load concept details once when name changes
    const initialAttemptsRequestedRef = React.useRef(false);
    useEffect(() => {
        let active = true;
        initialAttemptsRequestedRef.current = false; // reset for new concept
        (async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchConceptDetails(name);
                if (!initialAttemptsRequestedRef.current) {
                    initialAttemptsRequestedRef.current = true;
                    fetchConceptAttempts(name).catch(() => {});
                }
            } catch {
                if (active) setError("Failed to load concept details");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, fetchConceptDetails]);

    // Load overall progress chart (period based, not concept-specific; backend currently global)
    useEffect(() => {
        fetchProgressChart(period).catch(() => {
            /* handled in context */
        });
    }, [period, fetchProgressChart]);

    // conceptDetails now holds full payload { concept, history, attempts?, prerequisites, relatedConcepts }
    const payload = conceptDetails;
    const concept = payload?.concept;
    const history = payload?.history || [];
    const attemptsPayload = conceptAttempts[name];
    const attempts = attemptsPayload?.attempts || payload?.attempts || [];
    const attemptsTotal = attemptsPayload?.total ?? attempts.length;
    const relatedConcepts = payload?.relatedConcepts || [];
    const prerequisites = payload?.prerequisites || [];
    const detail = concept && concept.name === name ? concept : null;
    const [attemptEnsureTried, setAttemptEnsureTried] = useState(false);

    // Ensure at least one attempt exists if user has zero attempts (single shot)
    useEffect(() => {
        if (!detail) return;
        if (attemptEnsureTried) return;
        if (conceptAttemptsLoading) return;
        if (attempts.length > 0) return; // already have attempts
        setAttemptEnsureTried(true);
        (async () => {
            try {
                const res = await ensureConceptAttempt(name);
                if (res?.created) {
                    // refetch attempts
                    fetchConceptAttempts(name, { limit: 25, offset: 0 }).catch(
                        () => {},
                    );
                }
            } catch {
                /* swallow ensure errors */
            }
        })();
    }, [
        detail,
        attempts.length,
        attemptEnsureTried,
        conceptAttemptsLoading,
        ensureConceptAttempt,
        fetchConceptAttempts,
        name,
    ]);

    const handlePractice = (mode = "focused_practice") => {
        navigate("/learning/practice/create", {
            state: { customConcepts: [name], sessionType: mode },
        });
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto page-shell">
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                    <p className="text-gray-600">Loading concept data...</p>
                </div>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="max-w-4xl mx-auto page-shell">
                <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Concept Not Found
                    </h1>
                    <p className="text-gray-600 mb-6">
                        We couldn't retrieve data for this concept.
                    </p>
                    <button
                        onClick={() => navigate("/learning")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Back to Learning Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const mastery = detail.mastery ?? 0;
    const trendSource = history.length
        ? history.map((h) => ({ date: h.date, value: h.mastery }))
        : progressChart?.points || [];
    const recentTrend = trendSource;
    const last5 = recentTrend.slice(-5);
    const improvement =
        last5.length >= 2 ? last5[last5.length - 1].value - last5[0].value : 0;

    return (
        <div className="max-w-6xl mx-auto page-shell">
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                    {detail.name}
                </h1>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border border-gray-200 rounded-xl p-6 md:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Mastery
                    </h2>
                    <MasteryProgressBar mastery={mastery} showLabel={true} />
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
                        <div>
                            <span className="font-semibold">
                                Current Mastery:
                            </span>{" "}
                            {mastery}%
                        </div>
                        {detail.lastPracticed && (
                            <div>
                                <span className="font-semibold">
                                    Last Practiced:
                                </span>{" "}
                                {new Date(
                                    detail.lastPracticed,
                                ).toLocaleDateString()}
                            </div>
                        )}
                        {detail.nextReview && (
                            <div>
                                <span className="font-semibold">
                                    Next Review:
                                </span>{" "}
                                {new Date(
                                    detail.nextReview,
                                ).toLocaleDateString()}
                            </div>
                        )}
                        <div>
                            <span className="font-semibold">Attempts:</span>{" "}
                            {detail.totalAttempts || 0}
                        </div>
                        {improvement !== 0 && (
                            <div
                                className={
                                    improvement > 0
                                        ? "text-green-600 font-medium"
                                        : "text-red-600 font-medium"
                                }
                            >
                                {improvement > 0
                                    ? `Improved +${improvement.toFixed(
                                          1,
                                      )} pts recently`
                                    : `Dropped ${improvement.toFixed(
                                          1,
                                      )} pts recently`}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Practice
                    </h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => handlePractice("quick_practice")}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            Quick Review
                        </button>
                        <button
                            onClick={() => handlePractice("focused_practice")}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                        >
                            Focused Practice
                        </button>
                        <button
                            onClick={() => handlePractice("mastery_check")}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                            Mastery Check
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Recent Progress
                    </h2>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="quarter">Last Quarter</option>
                    </select>
                </div>
                {recentTrend.length > 0 ? (
                    <div className="flex items-end gap-2 h-40">
                        {recentTrend.slice(-12).map((p, idx) => (
                            <div
                                key={idx}
                                className="flex-1 flex flex-col items-center"
                            >
                                <div
                                    className="w-full bg-blue-100 rounded relative overflow-hidden"
                                    style={{ height: "100%" }}
                                >
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-indigo-500"
                                        style={{ height: `${p.value}%` }}
                                    />
                                </div>
                                <span className="text-[10px] mt-1 text-gray-500">
                                    {new Date(p.date).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        No progress data yet for this concept.
                    </p>
                )}
            </div>

            {/* Related Concepts */}
            {relatedConcepts.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Related Concepts
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {relatedConcepts.map((rel) => (
                            <ConceptTag
                                key={rel.name}
                                name={rel.name}
                                mastery={rel.mastery}
                                onClick={() =>
                                    navigate(
                                        `/learning/concepts/${encodeURIComponent(
                                            rel.name,
                                        )}`,
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Prerequisites */}
            {prerequisites.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Prerequisites
                    </h2>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {prerequisites.map((pr) => (
                            <li key={pr}>{pr}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Attempts Table (fetched via dedicated endpoint) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Recent Attempts
                </h2>
                {conceptAttemptsLoading && !attempts.length ? (
                    <p className="text-sm text-gray-600">Loading attempts...</p>
                ) : attempts.length > 0 ? (
                    <div className="overflow-x-auto -mx-1">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 border-b">
                                    <th className="py-2 pr-4 font-medium">
                                        Date
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Test
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Score
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Accuracy
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Answered
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.slice(0, 12).map((a) => (
                                    <tr
                                        key={a.attemptId}
                                        className="border-b last:border-none hover:bg-gray-50"
                                    >
                                        <td className="py-2 pr-4 whitespace-nowrap">
                                            {new Date(
                                                a.startedAt ||
                                                    a.date ||
                                                    Date.now(),
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <button
                                                onClick={() =>
                                                    a.testId &&
                                                    navigate(
                                                        `/tests/${a.testId}/analytics`,
                                                    )
                                                }
                                                className="text-blue-600 hover:underline font-medium"
                                            >
                                                {a.testTitle ||
                                                    a.testCode ||
                                                    (a.testId
                                                        ? a.testId.slice(0, 8)
                                                        : "Test")}
                                            </button>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span
                                                className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                                    a.status === "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {a.status === "completed"
                                                    ? "Completed"
                                                    : "In Progress"}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 font-semibold">
                                            {a.score != null
                                                ? `${a.score}%`
                                                : a.status === "in_progress"
                                                  ? "—"
                                                  : "—"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {a.accuracy != null
                                                ? `${a.accuracy}%`
                                                : "—"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {a.correct != null &&
                                            a.answered != null
                                                ? `${a.correct}/${a.answered}`
                                                : "—"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <div className="flex gap-2">
                                                {a.attemptId && (
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/attempts/${a.attemptId}`,
                                                            )
                                                        }
                                                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                                {a.testId && (
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/tests/${a.testId}/analytics`,
                                                            )
                                                        }
                                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                                    >
                                                        Analytics
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        No attempts yet involving this concept.
                    </p>
                )}
                {attemptsTotal > attempts.length && (
                    <p className="text-xs text-gray-500 mt-3">
                        Showing {attempts.length} of {attemptsTotal} attempts.
                    </p>
                )}
            </div>

            {/* End of content */}
        </div>
    );
}
