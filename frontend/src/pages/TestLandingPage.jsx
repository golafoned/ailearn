import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

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
    const { isAuthenticated, user } = useAuth();
    const toast = useToast();
    const autoStartedRef = useRef(false);
    const [testStatusCode, setTestStatusCode] = useState(null); // e.g., TEST_EXPIRED, TEST_CLOSED

    useEffect(() => {
        if (code) fetchTestByCode(code.toUpperCase());
    }, [code, fetchTestByCode]);

    const onStart = async (e) => {
        if (e) e.preventDefault();
        setStartError(null);
        setTestStatusCode(null);
        let finalParticipant = participantName.trim();
        let finalDisplay = displayName.trim();
        if (isAuthenticated) {
            finalParticipant =
                user?.displayName ||
                user?.email?.split("@")[0] ||
                "Participant";
            finalDisplay = user?.displayName || "";
        } else if (!finalParticipant) {
            setStartError("Participant name required");
            return;
        }
        try {
            await startAttempt({
                code: code.toUpperCase(),
                participantName: finalParticipant,
                displayName: finalDisplay || undefined,
            });
            navigate("/attempt");
        } catch (e) {
            // Attempt to read backend code from generic error message (context stores only message currently)
            const msg = (e && e.message) || "Unable to start attempt";
            if (/TEST_EXPIRED/.test(msg)) {
                setTestStatusCode("TEST_EXPIRED");
                setStartError("This test has expired.");
                toast.error("This test has expired.");
            } else if (/TEST_CLOSED/.test(msg)) {
                setTestStatusCode("TEST_CLOSED");
                setStartError("This test is closed.");
                toast.error("This test is closed.");
            } else {
                setStartError("Unable to start attempt");
                toast.error("Unable to start attempt");
            }
        }
    };

    // Auto-start for authenticated users once test metadata loads and no attempt yet
    useEffect(() => {
        if (
            isAuthenticated &&
            currentTest &&
            !attempt &&
            !loading &&
            !autoStartedRef.current &&
            !testStatusCode
        ) {
            autoStartedRef.current = true;
            onStart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, currentTest, attempt, loading, testStatusCode]);

    const renderError = () => {
        if (!error) return null;
        // error from context has only message; for richer codes we could extend context
        const msg =
            testStatusCode === "TEST_EXPIRED"
                ? "This test has expired."
                : testStatusCode === "TEST_CLOSED"
                ? "This test is closed."
                : /EXPIRED/i.test(error)
                ? "This test has expired."
                : /not found/i.test(error)
                ? "Test code not found."
                : error;
        return <p className="text-sm text-red-600 mb-4">{msg}</p>;
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-24 sm:py-32">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                {loading && !currentTest && (
                    <p className="text-sm text-gray-500">Loading test...</p>
                )}
                {error && !currentTest && renderError()}
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
                        {!isAuthenticated && (
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
                        )}
                        {isAuthenticated && !attempt && !testStatusCode && (
                            <p className="text-sm text-gray-500">
                                Starting test automatically...
                            </p>
                        )}
                        {testStatusCode && (
                            <p className="text-sm text-red-600 mt-4">
                                {testStatusCode === "TEST_EXPIRED" &&
                                    "This test can no longer be taken (expired)."}
                                {testStatusCode === "TEST_CLOSED" &&
                                    "The owner has closed this test."}
                            </p>
                        )}
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
