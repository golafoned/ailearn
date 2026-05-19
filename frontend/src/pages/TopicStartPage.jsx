import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLearning } from "../contexts/LearningContext";
import {
    parseFile,
    detectLanguage,
    SUPPORTED_EXTENSIONS,
    MAX_CHARS,
} from "../utils/fileParser";

const suggestions = [
    { label: "Python OOP", icon: "🐍", cat: "Programming" },
    { label: "React Hooks", icon: "⚛️", cat: "Programming" },
    { label: "SQL Joins", icon: "🗄️", cat: "Databases" },
    { label: "JavaScript Closures", icon: "📦", cat: "Programming" },
    { label: "Data Structures", icon: "🌳", cat: "CS Fundamentals" },
    { label: "Machine Learning", icon: "🤖", cat: "AI/ML" },
    { label: "CSS Flexbox", icon: "🎨", cat: "Web Dev" },
    { label: "REST APIs", icon: "🔗", cat: "Web Dev" },
    { label: "Git Branching", icon: "🔀", cat: "DevOps" },
    { label: "Algorithms", icon: "⚡", cat: "CS Fundamentals" },
    { label: "TypeScript Generics", icon: "📘", cat: "Programming" },
    { label: "Docker Basics", icon: "🐳", cat: "DevOps" },
];

const SOURCE_MODES = [
    {
        key: "ai",
        label: "AI freestyle",
        icon: "🤖",
        desc: "AI generates questions from its knowledge",
    },
    {
        key: "notes",
        label: "Paste notes",
        icon: "📝",
        desc: "Paste your study material",
    },
    {
        key: "file",
        label: "Upload file",
        icon: "📄",
        desc: "Upload .txt, .md, or .pdf",
    },
];

export function TopicStartPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { createSession } = useLearning();
    const fileInputRef = useRef(null);
    const dropRef = useRef(null);

    const [topic, setTopic] = useState(location.state?.topic || "");
    const [questionCount, setQuestionCount] = useState(10);
    const [sourceMode, setSourceMode] = useState("ai");
    const [sourceText, setSourceText] = useState("");
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState(null);

    // File upload state
    const [fileName, setFileName] = useState(null);
    const [fileMeta, setFileMeta] = useState(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [fileError, setFileError] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const detectedLang = sourceText ? detectLanguage(sourceText) : null;

    const handleFileSelect = useCallback(async (file) => {
        if (!file) return;
        setFileError(null);
        setFileLoading(true);
        try {
            const result = await parseFile(file);
            setSourceText(result.text);
            setFileName(file.name);
            setFileMeta(result.meta);
        } catch (err) {
            setFileError(err.message);
            setSourceText("");
            setFileName(null);
            setFileMeta(null);
        } finally {
            setFileLoading(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer?.files?.[0];
            if (file) handleFileSelect(file);
        },
        [handleFileSelect],
    );

    const handleStart = async (e) => {
        e.preventDefault();
        const t = topic.trim();
        if (!t) return;
        if (sourceMode !== "ai" && !sourceText.trim()) {
            setError(
                "Please provide source material or switch to AI freestyle mode.",
            );
            return;
        }
        setStarting(true);
        setError(null);
        try {
            const session = await createSession({
                sessionType: "focused_practice",
                conceptSelection: "topic",
                customConcepts: [t],
                questionCount,
                sourceText: sourceMode !== "ai" ? sourceText.trim() : undefined,
            });
            const testCode = session.testCode || session.code;
            navigate(`/code/${testCode}`, {
                state: { sessionId: session.sessionId, isAdaptive: true },
            });
        } catch (err) {
            console.error("Failed to start learning:", err);
            setError("Failed to start session. Please try again.");
        } finally {
            setStarting(false);
        }
    };

    const clearFile = () => {
        setSourceText("");
        setFileName(null);
        setFileMeta(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="max-w-3xl mx-auto page-shell">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-5">
                    <span className="text-4xl">🧠</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    What do you want to learn?
                </h1>
                <p className="text-gray-500 text-lg max-w-lg mx-auto">
                    Enter a topic and optionally provide your own study
                    material. AI generates personalized questions to test your
                    knowledge.
                </p>
            </div>

            <form onSubmit={handleStart} className="space-y-6">
                {/* Topic Input */}
                <div className="relative">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Історія України, React Hooks, Quantum Physics..."
                        className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all pr-12"
                        autoFocus
                    />
                    {topic && (
                        <button
                            type="button"
                            onClick={() => setTopic("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Question Count */}
                <div className="flex items-center gap-3 justify-center">
                    <span className="text-sm font-medium text-gray-600">
                        Questions:
                    </span>
                    {[5, 10, 15, 20].map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setQuestionCount(n)}
                            className={`w-12 h-10 rounded-xl text-sm font-bold transition-all ${
                                questionCount === n
                                    ? "bg-blue-600 text-white shadow-md scale-105"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300"
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                {/* Source Mode Selector */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-700">
                            Question source
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {SOURCE_MODES.map((mode) => (
                            <button
                                key={mode.key}
                                type="button"
                                onClick={() => {
                                    setSourceMode(mode.key);
                                    if (mode.key === "ai") {
                                        setSourceText("");
                                        setFileName(null);
                                        setFileMeta(null);
                                    }
                                }}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all ${
                                    sourceMode === mode.key
                                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200"
                                }`}
                            >
                                <span className="text-xl">{mode.icon}</span>
                                <span className="text-xs font-semibold">
                                    {mode.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Paste notes area */}
                    {sourceMode === "notes" && (
                        <div className="space-y-2 animate-in fade-in duration-200">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder="Paste your notes, textbook excerpts, lecture summaries, or any study material here. AI will generate questions based ONLY on this content..."
                                rows={8}
                                maxLength={MAX_CHARS}
                                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono"
                            />
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">
                                    {detectedLang && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                            {detectedLang} detected
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={`font-medium ${sourceText.length > MAX_CHARS * 0.9 ? "text-orange-500" : "text-gray-400"}`}
                                >
                                    {sourceText.length.toLocaleString()} /{" "}
                                    {MAX_CHARS.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* File upload area */}
                    {sourceMode === "file" && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                            {!fileName ? (
                                <div
                                    ref={dropRef}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                        dragOver
                                            ? "border-blue-500 bg-blue-50 scale-[1.01]"
                                            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
                                    }`}
                                >
                                    {fileLoading ? (
                                        <>
                                            <span className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                                            <span className="text-sm text-gray-600">
                                                Parsing file...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-4xl">📁</span>
                                            <div className="text-center">
                                                <span className="text-sm font-semibold text-blue-600">
                                                    Click to browse
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {" "}
                                                    or drag & drop
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                Supports: .txt, .md, .pdf
                                            </span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={SUPPORTED_EXTENSIONS.join(",")}
                                        className="hidden"
                                        onChange={(e) =>
                                            handleFileSelect(e.target.files[0])
                                        }
                                    />
                                </div>
                            ) : (
                                /* File loaded — show info card */
                                <div className="bg-white border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {fileName.endsWith(".pdf")
                                                    ? "📕"
                                                    : "📄"}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {fileName}
                                                </p>
                                                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                                    {fileMeta?.pages && (
                                                        <span>
                                                            {fileMeta.pages}{" "}
                                                            pages
                                                        </span>
                                                    )}
                                                    <span>
                                                        {fileMeta?.chars?.toLocaleString()}{" "}
                                                        chars
                                                    </span>
                                                    {fileMeta?.lang && (
                                                        <span className="bg-blue-100 text-blue-700 px-1.5 rounded-full font-medium">
                                                            {fileMeta.lang}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearFile}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Remove file"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {/* Preview */}
                                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                                        {sourceText.slice(0, 500)}
                                        {sourceText.length > 500 && (
                                            <span className="text-gray-400">
                                                {" "}
                                                ...(
                                                {(
                                                    sourceText.length - 500
                                                ).toLocaleString()}{" "}
                                                more chars)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {fileError && (
                                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">
                                    {fileError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* AI freestyle hint */}
                    {sourceMode === "ai" && (
                        <p className="text-xs text-gray-400 text-center">
                            AI will generate questions from its own knowledge
                            about the topic
                        </p>
                    )}
                </div>

                {/* Source Analysis Preview */}
                {sourceText && sourceMode !== "ai" && (
                    <div className="flex items-center gap-4 justify-center text-sm">
                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                            <span>✓</span>
                            <span className="font-medium">
                                {sourceText.length.toLocaleString()} chars
                                loaded
                            </span>
                        </div>
                        {detectedLang && (
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                                <span>🌐</span>
                                <span className="font-medium">
                                    {detectedLang}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
                            <span>📊</span>
                            <span className="font-medium">
                                ~{Math.ceil(sourceText.split(/\s+/).length)}{" "}
                                words
                            </span>
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 rounded-xl p-3 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={
                        !topic.trim() ||
                        starting ||
                        (sourceMode !== "ai" && !sourceText.trim())
                    }
                    className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                    {starting ? (
                        <span className="flex items-center justify-center gap-3">
                            <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            Generating questions...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <span>Start Learning</span>
                            <span className="text-xl">→</span>
                        </span>
                    )}
                </button>
            </form>

            {/* Topic Suggestions */}
            <div className="mt-10">
                <p className="text-sm text-gray-400 text-center mb-4 font-medium">
                    Popular topics
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((s) => (
                        <button
                            key={s.label}
                            type="button"
                            onClick={() => setTopic(s.label)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                topic === s.label
                                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200"
                            }`}
                        >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Alternative paths */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate("/learning/practice/create")}
                        className="p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all text-left group"
                    >
                        <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform inline-block">
                            ⚙️
                        </span>
                        <span className="font-semibold text-gray-900 block">
                            Advanced Practice
                        </span>
                        <span className="text-sm text-gray-500">
                            Choose concepts, difficulty, and session type
                        </span>
                    </button>
                    <button
                        onClick={() => navigate("/flashcards")}
                        className="p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all text-left group"
                    >
                        <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform inline-block">
                            🃏
                        </span>
                        <span className="font-semibold text-gray-900 block">
                            Study Flashcards
                        </span>
                        <span className="text-sm text-gray-500">
                            Review with spaced repetition
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
