import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import { Button } from "../components/Button";
import { IconClock } from "../components/Icons";
import { useTestData } from "../contexts/TestDataContext";
import { useNavigate } from "react-router-dom";

export function TestTakingPage() {
    const {
        previewTest,
        lastGeneratedCode,
        currentTest,
        attempt,
        submitAttempt,
    } = useTestData();
    const navigate = useNavigate();
    const activeTest = previewTest || currentTest; // preview (owner) or public attempt test
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // questionId -> optionKey
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [remaining, setRemaining] = useState(() => {
        if (!activeTest?.timeLimitSeconds) return 0;
        return activeTest.timeLimitSeconds;
    });

    // Normalize question options to array of {key, text}
    const question = activeTest?.questions?.[currentQuestionIndex];
    const options = useMemo(() => {
        if (!question) return [];
        if (Array.isArray(question.options)) {
            return question.options.map((opt, i) => ({
                key: String.fromCharCode(65 + i),
                text: opt,
            }));
        }
        if (question.options && typeof question.options === "object") {
            return Object.entries(question.options).map(([k, v]) => ({
                key: k,
                text: v,
            }));
        }
        return [];
    }, [question]);

    const buildAnswerArray = useCallback(
        () =>
            Object.entries(answers).map(([questionId, answer]) => ({
                questionId,
                answer,
            })),
        [answers]
    );

    const handleSubmit = useCallback(async () => {
        if (!attempt) {
            // preview mode just go to generated summary
            navigate("/generated");
            return;
        }
        setSubmitting(true);
        setSubmitError(null);
        try {
            await submitAttempt({
                attemptId: attempt.attemptId,
                answers: buildAnswerArray(),
            });
            navigate("/generated");
        } catch {
            setSubmitError("Submission failed");
        } finally {
            setSubmitting(false);
        }
    }, [attempt, submitAttempt, navigate, buildAnswerArray]);

    // Stable ref to submission to avoid adding handleSubmit as dependency while still always using latest
    const submitRef = useRef(handleSubmit);
    useEffect(() => {
        submitRef.current = handleSubmit;
    }, [handleSubmit]);
    useEffect(() => {
        if (!activeTest?.timeLimitSeconds) return;
        if (remaining <= 0) {
            if (attempt) submitRef.current();
            return;
        }
        const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
        return () => clearTimeout(id);
    }, [remaining, activeTest, attempt]);

    useEffect(() => {
        if (!activeTest) {
            navigate("/create");
        }
    }, [activeTest, navigate]);

    if (!activeTest) return null;

    const minutes = Math.floor(remaining / 60)
        .toString()
        .padStart(2, "0");
    const seconds = (remaining % 60).toString().padStart(2, "0");

    const selectAnswer = (qId, key) => {
        setAnswers((a) => ({ ...a, [qId]: key }));
    };

    const copyLink = async () => {
        try {
            const url = `${window.location.origin}/code/${
                lastGeneratedCode || activeTest.code
            }`;
            await navigator.clipboard.writeText(url);
        } catch {
            /* ignore */
        }
    };

    // (moved above)

    return (
        <div className="max-w-3xl mx-auto px-4 py-24 sm:py-32">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                <div className="flex justify-between items-start mb-6 pb-6 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeTest.title}
                        </h1>
                        <p className="text-gray-500">
                            Question {currentQuestionIndex + 1} of{" "}
                            {activeTest.questions.length}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            {activeTest.difficulty && (
                                <span className="uppercase tracking-wide">
                                    {activeTest.difficulty}
                                </span>
                            )}
                            {activeTest.code && (
                                <button
                                    onClick={copyLink}
                                    className="underline"
                                >
                                    Copy share link
                                </button>
                            )}
                        </div>
                        {activeTest.code && (
                            <div className="mt-4 flex gap-2">
                                <Button variant="secondary" onClick={copyLink}>
                                    Copy Link
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate("/create")}
                                >
                                    Create Another
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center text-lg font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                        <IconClock className="text-blue-800" />
                        <span>
                            {minutes}:{seconds}
                        </span>
                    </div>
                </div>
                {question && (
                    <div>
                        {(() => {
                            const questionText =
                                question.text ||
                                question.question ||
                                question.prompt ||
                                question.title ||
                                question.body ||
                                "";
                            return (
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                    {questionText || (
                                        <span className="italic text-gray-400">
                                            (No question text provided)
                                        </span>
                                    )}
                                </h2>
                            );
                        })()}
                        <div className="space-y-4">
                            {options.map((opt) => {
                                const checked =
                                    answers[question.id] === opt.key;
                                return (
                                    <label
                                        key={opt.key}
                                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                            checked
                                                ? "bg-blue-50 border-blue-500"
                                                : "border-gray-200 hover:bg-blue-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q_${question.id}`}
                                            checked={checked}
                                            onChange={() =>
                                                selectAnswer(
                                                    question.id,
                                                    opt.key
                                                )
                                            }
                                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="ml-4 text-gray-700">
                                            {opt.key}. {opt.text}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="flex justify-between mt-8 pt-6 border-t">
                    <Button
                        variant="secondary"
                        onClick={() =>
                            setCurrentQuestionIndex((p) => Math.max(0, p - 1))
                        }
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>
                    {currentQuestionIndex < activeTest.questions.length - 1 ? (
                        <Button
                            onClick={() =>
                                setCurrentQuestionIndex((p) => p + 1)
                            }
                        >
                            Next Question
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700 focus:ring-green-300"
                        >
                            {submitting ? "Submitting..." : "Submit Test"}
                        </Button>
                    )}
                </div>
                {submitError && (
                    <div className="text-sm text-red-600 mt-4">
                        {submitError}
                    </div>
                )}
            </div>
        </div>
    );
}
