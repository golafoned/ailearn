import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/Button";
import { IconUpload, IconArrowRight } from "../components/Icons";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch, ApiError } from "../utils/apiClient";
import { useTestData } from "../contexts/TestDataContext";
import { parseFile, SUPPORTED_EXTENSIONS } from "../utils/fileParser";

export function CreateTestPage() {
    const location = useLocation();

    // Core inputs
    const [sourceMode, setSourceMode] = useState("topic"); // "topic" or "file"
    const [topic, setTopic] = useState(location.state?.topic || "");
    const [fileName, setFileName] = useState("");
    const [fileObj, setFileObj] = useState(null);

    // Params
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState(10);
    const [timeLimit, setTimeLimit] = useState(15); // minutes
    const [difficulty, setDifficulty] = useState("medium");
    const [instructions, setInstructions] = useState("");
    const [expiresInMinutes, setExpiresInMinutes] = useState(60 * 24 * 7); // 7 days

    // State
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { setPreviewTest, setLastGeneratedCode, addLocalGeneratedTest } =
        useTestData();
    const abortRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const f = e.target.files[0];
            setFileObj(f);
            setFileName(f.name);
            if (!title) {
                setTitle(f.name.replace(/\.[^.]+$/, ""));
            }
        }
    };

    // Load persisted params
    useEffect(() => {
        try {
            const raw = localStorage.getItem("genParams");
            if (raw) {
                const p = JSON.parse(raw);
                if (p.questions) setQuestions(p.questions);
                if (p.timeLimit) setTimeLimit(p.timeLimit);
                if (p.difficulty) setDifficulty(p.difficulty);
                if (p.instructions) setInstructions(p.instructions);
                if (p.expiresInMinutes) setExpiresInMinutes(p.expiresInMinutes);
            }
        } catch {
            /* ignore */
        }
    }, []);

    // Persist on change
    useEffect(() => {
        const payload = {
            questions,
            timeLimit,
            difficulty,
            instructions,
            expiresInMinutes,
        };
        try {
            localStorage.setItem("genParams", JSON.stringify(payload));
        } catch {
            /* ignore */
        }
    }, [questions, timeLimit, difficulty, instructions, expiresInMinutes]);

    const readSourceFile = async (file) => {
        if (!file) return "";
        const result = await parseFile(file);
        return result.text;
    };

    const pollForQuestions = async (
        code,
        { timeoutMs = 120000, intervalMs = 1500 },
    ) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            try {
                const data = await apiFetch(`/api/v1/tests/code/${code}`, {
                    method: "GET",
                });
                if (
                    data &&
                    Array.isArray(data.questions) &&
                    data.questions.length > 0
                ) {
                    return data;
                }
            } catch (err) {
                if (!(err instanceof ApiError && err.status === 404)) {
                    throw err;
                }
            }
            await new Promise((res) => setTimeout(res, intervalMs));
        }
        throw new Error("Timed out waiting for test generation.");
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        abortRef.current = new AbortController();
        try {
            let finalSourceText = "";
            let generatedTitle = title;

            if (sourceMode === "file") {
                if (!fileObj) throw new Error("Please upload a file first.");
                finalSourceText = await readSourceFile(fileObj);
                if (!finalSourceText)
                    throw new Error("File is empty or unreadable.");
                if (!generatedTitle)
                    generatedTitle = fileName.replace(/\.[^.]+$/, "");
            } else {
                if (!topic.trim())
                    throw new Error("Please enter a topic to test.");
                if (!generatedTitle)
                    generatedTitle = `Test: ${topic.slice(0, 50)}`;
            }

            const payload = {
                title: (generatedTitle || "Untitled Test").slice(0, 120),
                questionCount: questions,
                difficulty,
                timeLimitSeconds: timeLimit * 60,
                expiresInMinutes: Number(expiresInMinutes) || 60,
                sourceText: sourceMode === "file" ? finalSourceText : undefined,
                topic: sourceMode === "topic" ? topic.trim() : undefined,
                extraInstructions: instructions.trim() || undefined,
            };

            const genResp = await apiFetch("/api/v1/tests/generate", {
                method: "POST",
                body: payload,
            });
            if (!genResp || !genResp.code)
                throw new Error("Generation response missing test code.");

            setLastGeneratedCode(genResp.code);
            addLocalGeneratedTest({
                id: genResp.id,
                code: genResp.code,
                title: payload.title,
                createdAt: new Date().toISOString(),
                expiresAt: genResp.expiresAt,
            });

            const full = await pollForQuestions(genResp.code, {});
            setPreviewTest(full);
            navigate("/generated");
        } catch (e) {
            if (e.name === "AbortError") return;
            console.error(e);
            setError(
                e instanceof ApiError
                    ? e.message
                    : e.message || "Generation failed",
            );
        } finally {
            setIsGenerating(false);
            abortRef.current = null;
        }
    };

    const handleAbort = () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        setIsGenerating(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-24 sm:py-32">
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-500 hover:text-gray-700 transition"
                    title="Go back"
                >
                    <span className="text-xl">←</span>
                </button>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                    Create Custom Test
                </h1>
            </div>
            <p className="text-sm text-gray-500 mb-6">
                Want quick practice instead?{" "}
                <button
                    onClick={() => navigate("/learning/start")}
                    className="text-blue-600 hover:underline font-medium"
                >
                    Start a topic-based session →
                </button>
            </p>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm space-y-8">
                {/* Source Selection Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setSourceMode("topic")}
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all ${
                            sourceMode === "topic"
                                ? "bg-white text-blue-600 shadow border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        📝 By Topic
                    </button>
                    <button
                        onClick={() => setSourceMode("file")}
                        className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all ${
                            sourceMode === "file"
                                ? "bg-white text-blue-600 shadow border border-gray-200"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        📄 Upload File
                    </button>
                </div>

                {/* Source Input */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    {sourceMode === "topic" ? (
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">
                                What do you want to test? *
                            </label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="E.g., CSS Flexbox and Grid layout, Cell division in Biology, or The concept of OOP in Python..."
                                rows={3}
                                className="w-full border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Be as general or specific as you want. AI will
                                generate questions based on this knowledge.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">
                                Upload Reference Material *
                            </label>
                            <label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <IconUpload className="text-blue-500 mb-3" />
                                    {fileName ? (
                                        <>
                                            <p className="mb-2 text-sm text-blue-700 font-semibold text-center px-4">
                                                {fileName}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                Click to replace file
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-2 text-sm text-blue-800">
                                                <span className="font-semibold">
                                                    Click to upload
                                                </span>{" "}
                                                or drag and drop
                                            </p>
                                            <p className="text-xs text-blue-600 font-medium">
                                                TXT only (MAX. 10MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="dropzone-file"
                                    type="file"
                                    accept=".txt,.md,.pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* Grid for Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Number of Questions:{" "}
                            <span className="text-blue-600 font-bold">
                                {questions}
                            </span>
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={questions}
                            onChange={(e) =>
                                setQuestions(Number(e.target.value))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                            <span>5</span>
                            <span>25</span>
                            <span>50</span>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Difficulty Level
                        </label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        >
                            <option value="easy">Easy (Fundamentals)</option>
                            <option value="medium">Medium (Standard)</option>
                            <option value="hard">Hard (Advanced)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Time Limit:{" "}
                            <span className="text-blue-600 font-bold">
                                {timeLimit} mins
                            </span>
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={timeLimit}
                            onChange={(e) =>
                                setTimeLimit(Number(e.target.value))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Test Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            maxLength={120}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={
                                sourceMode === "file" && fileName
                                    ? fileName.replace(/\.[^.]+$/, "")
                                    : "Leave blank to auto-generate"
                            }
                            className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>
                </div>

                {/* Optional Instructions */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Special Instructions (Optional)
                    </label>
                    <input
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="E.g., Give scenario-based questions, no true/false..."
                        className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start">
                        <span className="mr-2">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        disabled={isGenerating}
                    >
                        Cancel
                    </Button>

                    {isGenerating ? (
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleAbort}>
                                Stop
                            </Button>
                            <Button
                                disabled
                                className="min-w-[150px] justify-center bg-blue-500 opacity-90 cursor-wait"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                    Generating...
                                </div>
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            className="min-w-[150px] justify-center text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                            disabled={
                                sourceMode === "topic"
                                    ? !topic.trim()
                                    : !fileObj
                            }
                        >
                            Generate Test{" "}
                            <IconArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
