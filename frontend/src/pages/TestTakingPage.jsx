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
import { useLearning } from "../contexts/LearningContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
    DifficultyIndicator,
    ConceptTag,
} from "../components/LearningComponents";

export function TestTakingPage() {
    const {
        previewTest,
        lastGeneratedCode,
        currentTest,
        attempt,
        submitAttempt,
    } = useTestData();
    const { completeSession, currentSession } = useLearning();
    const navigate = useNavigate();
    const location = useLocation();
    const activeTest = previewTest || currentTest;

    // Check if this is an adaptive learning session
    const sessionId = location.state?.sessionId || currentSession?.sessionId;
    const startTime = useRef(Date.now());

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // questionId -> answer value
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [remaining, setRemaining] = useState(() => {
        if (!activeTest?.timeLimitSeconds) return 0;
        return activeTest.timeLimitSeconds;
    });

    const question = activeTest?.questions?.[currentQuestionIndex];
    const questionType = question?.type || "multiple-choice";
    const isMultipleSelect =
        questionType === "multiple-select" ||
        questionType === "multiselect" ||
        questionType === "checkbox";

    // Normalize question options based on type
    const options = useMemo(() => {
        if (!question) return [];

        // True/False questions
        if (questionType === "true/false" || questionType === "truefalse") {
            return [
                { key: "true", text: "True", value: "true" },
                { key: "false", text: "False", value: "false" },
            ];
        }

        // Multiple choice/select questions
        if (Array.isArray(question.options) && question.options.length > 0) {
            return question.options.map((opt, i) => ({
                key: String.fromCharCode(65 + i),
                text: opt,
                value: opt, // The actual option text is the answer value
            }));
        }

        // Object-based options (legacy support)
        if (question.options && typeof question.options === "object") {
            return Object.entries(question.options).map(([k, v]) => ({
                key: k,
                text: v,
                value: v,
            }));
        }

        return [];
    }, [question, questionType]);

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
            // Check if this is an adaptive learning session
            if (sessionId) {
                // Complete adaptive session with mastery tracking
                const timeSpent = Math.floor(
                    (Date.now() - startTime.current) / 1000
                );
                const results = await completeSession(
                    sessionId,
                    buildAnswerArray(),
                    timeSpent
                );
                // Navigate to results page with mastery changes
                navigate("/learning/session/results", { state: { results } });
            } else {
                // Regular test submission
                await submitAttempt({
                    attemptId: attempt.attemptId,
                    answers: buildAnswerArray(),
                });
                navigate("/generated");
            }
        } catch {
            setSubmitError("Submission failed");
        } finally {
            setSubmitting(false);
        }
    }, [
        attempt,
        sessionId,
        submitAttempt,
        completeSession,
        navigate,
        buildAnswerArray,
    ]);

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

    const selectAnswer = (qId, value, isMultiple = false) => {
        if (isMultiple) {
            // For multiple-select, toggle the value in an array
            setAnswers((prev) => {
                const current = prev[qId];
                const currentArray = Array.isArray(current)
                    ? current
                    : current
                    ? [current]
                    : [];
                const newArray = currentArray.includes(value)
                    ? currentArray.filter((v) => v !== value)
                    : [...currentArray, value];
                // Sort alphabetically for consistent comparison
                return { ...prev, [qId]: newArray.sort().join(", ") };
            });
        } else {
            // Single select - replace value
            setAnswers((a) => ({ ...a, [qId]: value }));
        }
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

    const progress =
        ((currentQuestionIndex + 1) / activeTest.questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-4xl mx-auto px-4 py-20 sm:py-24">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">
                                {activeTest.title}
                            </h1>
                            <p className="text-blue-100 text-sm">
                                {answeredCount} of {activeTest.questions.length}{" "}
                                answered
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-lg font-semibold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <IconClock className="text-white" />
                            <span>
                                {minutes}:{seconds}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-200">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Question Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-900">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <span className="text-gray-400 text-sm">
                                of {activeTest.questions.length}
                            </span>
                            {question?.difficulty && (
                                <DifficultyIndicator
                                    difficulty={question.difficulty}
                                    size="small"
                                />
                            )}
                        </div>
                        {activeTest.code && !attempt && (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={copyLink}
                                    className="text-sm"
                                >
                                    Copy Link
                                </Button>
                            </div>
                        )}
                    </div>
                    {question?.concepts && question.concepts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {question.concepts.map((concept, idx) => (
                                <ConceptTag key={idx} name={concept} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Question Content */}
                <div className="p-8">
                    {question && (
                        <div>
                            {/* Question Type Badge */}
                            <div className="mb-4">
                                <span
                                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                                        questionType === "true/false" ||
                                        questionType === "truefalse"
                                            ? "bg-purple-100 text-purple-700"
                                            : isMultipleSelect
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                    {questionType === "true/false" ||
                                    questionType === "truefalse"
                                        ? "True/False"
                                        : isMultipleSelect
                                        ? "Multiple Select"
                                        : "Multiple Choice"}
                                </span>
                                {isMultipleSelect && (
                                    <span className="ml-2 text-xs text-gray-500 italic">
                                        (Select all that apply)
                                    </span>
                                )}
                            </div>

                            {/* Question Text */}
                            {(() => {
                                const questionText =
                                    question.text ||
                                    question.question ||
                                    question.prompt ||
                                    question.title ||
                                    question.body ||
                                    "";
                                return (
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
                                        {questionText || (
                                            <span className="italic text-gray-400">
                                                (No question text provided)
                                            </span>
                                        )}
                                    </h2>
                                );
                            })()}

                            {/* Answer Options */}
                            <div
                                className={`space-y-3 ${
                                    questionType === "true/false" ||
                                    questionType === "truefalse"
                                        ? "grid grid-cols-2 gap-4"
                                        : ""
                                }`}
                            >
                                {options.map((opt) => {
                                    const currentAnswer = answers[question.id];
                                    const checked = isMultipleSelect
                                        ? currentAnswer &&
                                          currentAnswer
                                              .split(", ")
                                              .includes(opt.value)
                                        : currentAnswer === opt.value;
                                    const isTrueFalse =
                                        questionType === "true/false" ||
                                        questionType === "truefalse";

                                    return (
                                        <label
                                            key={opt.key}
                                            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                checked
                                                    ? isTrueFalse
                                                        ? opt.value === "true"
                                                            ? "bg-green-50 border-green-500 ring-2 ring-green-200"
                                                            : "bg-red-50 border-red-500 ring-2 ring-red-200"
                                                        : isMultipleSelect
                                                        ? "bg-orange-50 border-orange-500 ring-2 ring-orange-200"
                                                        : "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            <input
                                                type={
                                                    isMultipleSelect
                                                        ? "checkbox"
                                                        : "radio"
                                                }
                                                name={
                                                    isMultipleSelect
                                                        ? undefined
                                                        : `q_${question.id}`
                                                }
                                                checked={checked}
                                                onChange={() =>
                                                    selectAnswer(
                                                        question.id,
                                                        opt.value,
                                                        isMultipleSelect
                                                    )
                                                }
                                                className={`w-5 h-5 ${
                                                    isMultipleSelect
                                                        ? "text-orange-600 rounded"
                                                        : "text-blue-600"
                                                } bg-gray-100 border-gray-300 focus:ring-2 ${
                                                    isMultipleSelect
                                                        ? "focus:ring-orange-500"
                                                        : "focus:ring-blue-500"
                                                }`}
                                            />
                                            <span
                                                className={`ml-4 font-medium ${
                                                    checked
                                                        ? isTrueFalse
                                                            ? opt.value ===
                                                              "true"
                                                                ? "text-green-700"
                                                                : "text-red-700"
                                                            : isMultipleSelect
                                                            ? "text-orange-700"
                                                            : "text-blue-700"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                {isTrueFalse ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-2xl">
                                                            {opt.value ===
                                                            "true"
                                                                ? "✓"
                                                                : "✗"}
                                                        </span>
                                                        <span>{opt.text}</span>
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="inline-block w-6 text-center font-bold">
                                                            {opt.key}.
                                                        </span>{" "}
                                                        {opt.text}
                                                    </>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="secondary"
                            onClick={() =>
                                setCurrentQuestionIndex((p) =>
                                    Math.max(0, p - 1)
                                )
                            }
                            disabled={currentQuestionIndex === 0}
                            className="px-6"
                        >
                            ← Previous
                        </Button>

                        <div className="flex gap-2">
                            {/* Quick navigation dots */}
                            <div className="hidden sm:flex items-center gap-1">
                                {activeTest.questions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() =>
                                            setCurrentQuestionIndex(idx)
                                        }
                                        className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                                            idx === currentQuestionIndex
                                                ? "bg-blue-600 text-white ring-2 ring-blue-300"
                                                : answers[
                                                      activeTest.questions[idx]
                                                          .id
                                                  ]
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                        }`}
                                        title={`Question ${idx + 1}${
                                            answers[
                                                activeTest.questions[idx].id
                                            ]
                                                ? " (Answered)"
                                                : ""
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentQuestionIndex <
                        activeTest.questions.length - 1 ? (
                            <Button
                                onClick={() =>
                                    setCurrentQuestionIndex((p) => p + 1)
                                }
                                className="px-6"
                            >
                                Next →
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6"
                            >
                                {submitting ? "Submitting..." : "✓ Submit Test"}
                            </Button>
                        )}
                    </div>
                    {submitError && (
                        <div className="text-sm text-red-600 mt-3 text-center">
                            {submitError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
