import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { Button } from "../components/Button";

export function TestLandingPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const {
        fetchTestByCode,
        currentTest,
        loading,
        error,
        startAttempt,
        attempt,
    } = useTestData();
    const [participantName, setParticipantName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [startError, setStartError] = useState(null);

    useEffect(() => {
        if (code) fetchTestByCode(code.toUpperCase());
    }, [code, fetchTestByCode]);

    const onStart = async (e) => {
        e.preventDefault();
        setStartError(null);
        if (!participantName.trim()) {
            setStartError("Participant name required");
            return;
        }
        try {
            await startAttempt({
                code: code.toUpperCase(),
                participantName: participantName.trim(),
                displayName: displayName.trim() || undefined,
            });
            navigate("/attempt");
        } catch {
            setStartError("Unable to start attempt");
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-24 sm:py-32">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                {loading && !currentTest && (
                    <p className="text-sm text-gray-500">Loading test...</p>
                )}
                {error && !currentTest && (
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                )}
                {currentTest && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">
                            {currentTest.title}
                        </h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Code:{" "}
                            <span className="font-mono">
                                {currentTest.code}
                            </span>{" "}
                            • {currentTest.questions.length} questions •{" "}
                            {Math.round(currentTest.timeLimitSeconds / 60)} min
                        </p>
                        <form onSubmit={onStart} className="space-y-5">
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1"
                                    htmlFor="participantName"
                                >
                                    Your Name *
                                </label>
                                <input
                                    id="participantName"
                                    value={participantName}
                                    onChange={(e) =>
                                        setParticipantName(e.target.value)
                                    }
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1"
                                    htmlFor="displayName"
                                >
                                    Display Name (optional)
                                </label>
                                <input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) =>
                                        setDisplayName(e.target.value)
                                    }
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    placeholder="Shown publicly"
                                />
                            </div>
                            {startError && (
                                <div className="text-sm text-red-600">
                                    {startError}
                                </div>
                            )}
                            <Button
                                disabled={loading}
                                type="submit"
                                className="w-full"
                            >
                                {loading ? "Starting..." : "Start Test"}
                            </Button>
                        </form>
                    </>
                )}
                {attempt && (
                    <div className="mt-6 text-sm text-green-600">
                        Attempt started.
                    </div>
                )}
            </div>
        </div>
    );
}
