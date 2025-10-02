import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLearning } from "../contexts/LearningContext";
import { ConceptTag } from "../components/LearningComponents";

export function PracticeSessionCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { concepts, fetchConcepts, createSession } = useLearning();

    // Pre-fill from navigation state
    const initialState = location.state || {};

    const [sessionType, setSessionType] = useState(
        initialState.sessionType || "quick_practice"
    );
    const [conceptSelection, setConceptSelection] = useState(
        initialState.conceptSelection || "due"
    );
    const [customConcepts, setCustomConcepts] = useState(
        initialState.customConcepts || []
    );
    const [difficulty, setDifficulty] = useState("adaptive");
    const [questionCount, setQuestionCount] = useState(10);
    const [creating, setCreating] = useState(false);
    const [showConceptPicker, setShowConceptPicker] = useState(false);

    useEffect(() => {
        if (showConceptPicker) {
            fetchConcepts({ filter: "all", sort: "mastery" });
        }
    }, [showConceptPicker, fetchConcepts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const session = await createSession({
                sessionType,
                conceptSelection:
                    conceptSelection === "custom" ? "custom" : conceptSelection,
                customConcepts:
                    conceptSelection === "custom" ? customConcepts : undefined,
                targetDifficulty: difficulty,
                questionCount,
            });

            // Navigate to test taking page with session context
            navigate(`/code/${session.testCode}`, {
                state: { sessionId: session.sessionId, isAdaptive: true },
            });
        } catch (e) {
            console.error("Failed to create session:", e);
        } finally {
            setCreating(false);
        }
    };

    const sessionTypes = {
        quick_practice: {
            name: "Quick Review",
            description: "5-10 minutes • Fast practice for due concepts",
            icon: "⚡",
            questions: 10,
        },
        focused_practice: {
            name: "Focused Practice",
            description: "15-20 minutes • Deep dive into 2-3 concepts",
            icon: "🎯",
            questions: 15,
        },
        mastery_check: {
            name: "Mastery Challenge",
            description: "25-30 minutes • Comprehensive test",
            icon: "🏆",
            questions: 25,
        },
        weak_concepts: {
            name: "Weak Concepts Sprint",
            description: "10-15 minutes • Focus on struggling areas",
            icon: "💪",
            questions: 12,
        },
    };

    const handleAddConcept = (conceptName) => {
        if (!customConcepts.includes(conceptName)) {
            setCustomConcepts([...customConcepts, conceptName]);
        }
    };

    const handleRemoveConcept = (conceptName) => {
        setCustomConcepts(customConcepts.filter((c) => c !== conceptName));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate("/learning")}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                    ← Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                    Create Practice Session
                </h1>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6"
            >
                {/* Session Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Session Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(sessionTypes).map(([key, type]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setSessionType(key);
                                    setQuestionCount(type.questions);
                                }}
                                className={`text-left p-4 rounded-lg border-2 transition-all ${
                                    sessionType === key
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">
                                        {type.icon}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {type.name}
                                        </h3>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {type.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Concept Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Target Concepts *
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                value="due"
                                checked={conceptSelection === "due"}
                                onChange={(e) =>
                                    setConceptSelection(e.target.value)
                                }
                                className="mt-1"
                            />
                            <div>
                                <div className="font-medium text-gray-900">
                                    Due for Review
                                </div>
                                <div className="text-xs text-gray-600">
                                    Practice concepts scheduled for spaced
                                    repetition
                                </div>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                value="weak"
                                checked={conceptSelection === "weak"}
                                onChange={(e) =>
                                    setConceptSelection(e.target.value)
                                }
                                className="mt-1"
                            />
                            <div>
                                <div className="font-medium text-gray-900">
                                    Weakest Concepts
                                </div>
                                <div className="text-xs text-gray-600">
                                    Focus on concepts with mastery below 40%
                                </div>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                value="random"
                                checked={conceptSelection === "random"}
                                onChange={(e) =>
                                    setConceptSelection(e.target.value)
                                }
                                className="mt-1"
                            />
                            <div>
                                <div className="font-medium text-gray-900">
                                    Random Mix
                                </div>
                                <div className="text-xs text-gray-600">
                                    Practice a random selection of concepts
                                </div>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                value="custom"
                                checked={conceptSelection === "custom"}
                                onChange={(e) =>
                                    setConceptSelection(e.target.value)
                                }
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                    Custom Selection
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                    Choose specific concepts to practice
                                </div>
                                {conceptSelection === "custom" && (
                                    <div>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {customConcepts.map((concept) => (
                                                <ConceptTag
                                                    key={concept}
                                                    name={concept}
                                                    removable
                                                    onRemove={() =>
                                                        handleRemoveConcept(
                                                            concept
                                                        )
                                                    }
                                                />
                                            ))}
                                            {customConcepts.length === 0 && (
                                                <span className="text-xs text-gray-500 italic">
                                                    No concepts selected
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConceptPicker(
                                                    !showConceptPicker
                                                )
                                            }
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            {showConceptPicker
                                                ? "Hide"
                                                : "Choose"}{" "}
                                            concepts
                                        </button>
                                        {showConceptPicker && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                                                {concepts &&
                                                concepts.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {concepts.map(
                                                            (concept) => (
                                                                <button
                                                                    key={
                                                                        concept.name
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleAddConcept(
                                                                            concept.name
                                                                        )
                                                                    }
                                                                    disabled={customConcepts.includes(
                                                                        concept.name
                                                                    )}
                                                                    className="w-full text-left px-3 py-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                                                >
                                                                    {
                                                                        concept.name
                                                                    }{" "}
                                                                    (
                                                                    {
                                                                        concept.mastery
                                                                    }
                                                                    %)
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">
                                                        Loading concepts...
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Difficulty Mode *
                    </label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="adaptive">
                            Adaptive (Recommended) - Adjusts based on
                            performance
                        </option>
                        <option value="easy">
                            Easy Only - Build confidence
                        </option>
                        <option value="medium">
                            Medium Only - Balanced challenge
                        </option>
                        <option value="hard">Hard Only - Test mastery</option>
                        <option value="progressive">
                            Progressive - Start easy, get harder
                        </option>
                    </select>
                </div>

                {/* Question Count */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Number of Questions: {questionCount}
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="30"
                        step="5"
                        value={questionCount}
                        onChange={(e) =>
                            setQuestionCount(parseInt(e.target.value))
                        }
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5 (Quick)</span>
                        <span>15 (Standard)</span>
                        <span>30 (Long)</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate("/learning")}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        disabled={creating}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            creating ||
                            (conceptSelection === "custom" &&
                                customConcepts.length === 0)
                        }
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? "Creating..." : "Generate Practice Session"}
                    </button>
                </div>
            </form>
        </div>
    );
}
