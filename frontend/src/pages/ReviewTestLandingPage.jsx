import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export function ReviewTestLandingPage() {
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
    const [testStatusCode, setTestStatusCode] = useState(null);
    const [isForbidden, setIsForbidden] = useState(false); // Track if user is not the owner

    useEffect(() => {
        if (code) fetchTestByCode(code.toUpperCase());
    }, [code, fetchTestByCode]);

    const onStart = async (e) => {
        if (e) e.preventDefault();
        setStartError(null);
        setTestStatusCode(null);
        setIsForbidden(false);

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
            const msg = (e && e.message) || "Unable to start attempt";

            // Check for review-specific errors
            if (
                /FORBIDDEN_REVIEW_START/.test(msg) ||
                /cannot start this review/i.test(msg)
            ) {
                setIsForbidden(true);
                setStartError(
                    "You cannot start this review test. It belongs to another user."
                );
                toast.error(
                    "You cannot start this review test. It belongs to another user."
                );
            } else if (/TEST_EXPIRED/.test(msg)) {
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

    // Auto-start for authenticated users once test metadata loads
    useEffect(() => {
        if (
            isAuthenticated &&
            currentTest &&
            !attempt &&
            !loading &&
            !autoStartedRef.current &&
            !testStatusCode &&
            !isForbidden
        ) {
            autoStartedRef.current = true;
            onStart();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isAuthenticated,
        currentTest,
        attempt,
        loading,
        testStatusCode,
        isForbidden,
    ]);

    const renderError = () => {
        if (!error && !isForbidden) return null;

        let msg = error;
        if (isForbidden) {
            msg =
                "You cannot start this review test. It belongs to another user.";
        } else if (testStatusCode === "TEST_EXPIRED") {
            msg = "This test has expired.";
        } else if (testStatusCode === "TEST_CLOSED") {
            msg = "This test is closed.";
        } else if (/EXPIRED/i.test(error)) {
            msg = "This test has expired.";
        } else if (/not found/i.test(error)) {
            msg = "Test code not found.";
        }

        return <p className="text-sm text-red-600 mb-4">{msg}</p>;
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-24 sm:py-32">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                        📝 Review Test
                    </span>
                </div>

                {loading && !currentTest && (
                    <div className="py-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                        <p className="text-sm text-gray-600 font-medium">
                            Loading review test...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Fetching your personalized questions
                        </p>
                    </div>
                )}

                {(error || isForbidden) && !currentTest && renderError()}

                {currentTest && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">
                            {currentTest.title}
                        </h1>
                        <p className="text-gray-500 text-sm mb-2">
                            Code:{" "}
                            <span className="font-mono font-semibold">
                                {currentTest.code}
                            </span>{" "}
                            • {currentTest.questions?.length || 0} questions •{" "}
                            {currentTest.timeLimitSeconds
                                ? `${Math.round(
                                      currentTest.timeLimitSeconds / 60
                                  )} min`
                                : "No time limit"}
                        </p>
                        <p className="text-gray-600 text-xs mb-6 bg-purple-50 p-3 rounded-lg border border-purple-100">
                            💡 This practice test is generated from questions
                            you previously got wrong. Master these concepts to
                            improve your performance!
                        </p>

                        {isForbidden && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700 font-medium">
                                    ⚠️ Access Denied
                                </p>
                                <p className="text-sm text-red-600 mt-1">
                                    Only the creator of this review test can
                                    start it.
                                </p>
                                <button
                                    onClick={() => navigate("/review-tests")}
                                    className="mt-3 text-sm text-blue-600 hover:underline"
                                >
                                    View your review tests →
                                </button>
                            </div>
                        )}

                        {!isAuthenticated && !isForbidden && (
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
                                    {loading ? "Starting..." : "Start Review"}
                                </Button>
                            </form>
                        )}

                        {isAuthenticated &&
                            !attempt &&
                            !testStatusCode &&
                            !isForbidden && (
                                <div className="text-center py-4">
                                    <div className="inline-block animate-pulse mb-2">
                                        <span className="text-2xl">🚀</span>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">
                                        Starting your review test...
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Get ready to practice!
                                    </p>
                                </div>
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

                {/* Navigation happens in onStart, no need to show message */}
            </div>
        </div>
    );
}
