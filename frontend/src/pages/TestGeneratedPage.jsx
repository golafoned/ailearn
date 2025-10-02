import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../components/Button";
import { IconCopy, IconCheck } from "../components/Icons";
import { copyToClipboard } from "../utils/clipboard";
import { useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";

export function TestGeneratedPage() {
    const {
        previewTest,
        lastGeneratedCode,
        attempt,
        fetchAttemptDetail,
        attemptDetail,
    } = useTestData();
    const code =
        previewTest?.code || attempt?.code || lastGeneratedCode || "unknown";
    const testLink = useMemo(
        () => `${window.location.origin}/code/${code}`,
        [code]
    );
    const [copied, setCopied] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const navigate = useNavigate();
    const handleCopy = async () => {
        const ok = await copyToClipboard(testLink);
        setCopied(ok);
        if (ok) setTimeout(() => setCopied(false), 2000);
    };
    const handleCopyCode = async () => {
        const ok = await copyToClipboard(code);
        setCopiedCode(ok);
        if (ok) setTimeout(() => setCopiedCode(false), 2000);
    };
    const isAttemptResult = attempt && attempt.submittedAt; // user finished a real attempt
    let heading = "Your Test is Ready!";
    if (isAttemptResult) heading = "Test Completed";
    // Load participant attempt detail (only after real attempt submitted)
    useEffect(() => {
        if (attempt && attempt.submittedAt) {
            fetchAttemptDetail(attempt.id).catch(() => {});
        }
    }, [attempt, fetchAttemptDetail]);

    const participantQuestions = attemptDetail?.questions || [];

    return (
        <div className="max-w-2xl mx-auto px-4 py-24 sm:py-32 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
                {heading}
            </h1>
            {!isAttemptResult && (
                <p className="text-gray-500 mb-8">
                    Share the link below with your participants.
                </p>
            )}
            {isAttemptResult && (
                <div className="mb-8">
                    <p className="text-lg text-gray-700 mb-2">Your Score:</p>
                    <div className="text-5xl font-extrabold tracking-tight">
                        {attempt.score == null ? "—" : `${attempt.score}%`}
                    </div>
                    {attempt.totalQuestions != null && (
                        <p className="mt-2 text-sm text-gray-500">
                            {attempt.answered ?? "-"} answered /{" "}
                            {attempt.totalQuestions} questions
                        </p>
                    )}
                </div>
            )}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                <label
                    htmlFor="test-link"
                    className="block mb-2 text-sm font-medium text-gray-700 text-left"
                >
                    Shareable Test Link
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        id="test-link"
                        type="text"
                        readOnly
                        value={testLink}
                        className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    />
                    <Button onClick={handleCopy} className="px-4 py-2.5">
                        {copied ? <IconCheck /> : <IconCopy />}
                        <span className="ml-2">
                            {copied ? "Copied!" : "Copy"}
                        </span>
                    </Button>
                </div>
                <div className="mt-6 text-left">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Test Code
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            readOnly
                            value={code}
                            className="w-full bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        />
                        <Button
                            onClick={handleCopyCode}
                            className="px-4 py-2.5"
                        >
                            {copiedCode ? <IconCheck /> : <IconCopy />}
                            <span className="ml-2">
                                {copiedCode ? "Copied!" : "Copy"}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
            {isAttemptResult && participantQuestions.length > 0 && (
                <div className="mt-10 text-left">
                    <h2 className="text-xl font-semibold mb-4">Your Answers</h2>
                    <ul className="space-y-4">
                        {participantQuestions.map((q, idx) => {
                            const chosen = q.answer;
                            return (
                                <li
                                    key={q.id || idx}
                                    className="border rounded-lg p-4 bg-white"
                                >
                                    <p className="font-medium text-gray-900 mb-2">
                                        Q{idx + 1}.{" "}
                                        {q.prompt || q.question || "Question"}
                                    </p>
                                    {q.options && Array.isArray(q.options) ? (
                                        <ul className="space-y-1">
                                            {q.options.map((opt, i) => {
                                                const isChosen = chosen === i;
                                                return (
                                                    <li
                                                        key={i}
                                                        className={`text-sm px-2 py-1 rounded ${
                                                            isChosen
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {opt}
                                                        {isChosen && (
                                                            <span className="ml-2 text-xs">
                                                                (your answer)
                                                            </span>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm">
                                            Your answer:{" "}
                                            {chosen == null
                                                ? "—"
                                                : String(chosen)}
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            <div className="mt-8 flex gap-4 justify-center">
                {isAttemptResult && attempt?.id && (
                    <Button
                        onClick={() => navigate(`/attempts/${attempt.id}`)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        📝 View Detailed Results & Hints
                    </Button>
                )}
                <Button
                    onClick={() => navigate("/dashboard")}
                    variant="secondary"
                >
                    {isAttemptResult
                        ? "Return to Dashboard"
                        : "Back to Dashboard"}
                </Button>
            </div>
        </div>
    );
}
