import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/Button";
import { IconUpload, IconArrowRight } from "../components/Icons";
import { useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "../utils/apiClient";
import { useTestData } from "../contexts/TestDataContext";

export function CreateTestPage() {
    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState("");
    const [fileObj, setFileObj] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [questions, setQuestions] = useState(20);
    const [timeLimit, setTimeLimit] = useState(30); // minutes
    const [difficulty, setDifficulty] = useState("easy");
    const [title, setTitle] = useState("");
    const [instructions, setInstructions] = useState("");
    const [expiresInMinutes, setExpiresInMinutes] = useState(60);
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
                if (p.title) setTitle(p.title);
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
            title,
            instructions,
            expiresInMinutes,
        };
        try {
            localStorage.setItem("genParams", JSON.stringify(payload));
        } catch {
            /* ignore */
        }
    }, [
        questions,
        timeLimit,
        difficulty,
        title,
        instructions,
        expiresInMinutes,
    ]);

    const readTextFile = async (file) => {
        if (!file) return "";
        // Only handling .txt now per requirement
        if (!/\.txt$/i.test(file.name)) {
            throw new Error("Only .txt files are supported at this time.");
        }
        const raw = await file.text();
        // Basic normalization: collapse excessive whitespace
        return raw
            .replace(/\r\n?/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    };

    const pollForQuestions = async (
        code,
        { timeoutMs = 120000, intervalMs = 1500 }
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
                // If 404 continue polling; other errors escalate
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
            const sourceText = await readTextFile(fileObj);
            if (!sourceText) throw new Error("File is empty or unreadable.");
            const payload = {
                title: (
                    title ||
                    fileName.replace(/\.[^.]+$/, "") ||
                    "Untitled Test"
                ).slice(0, 120),
                questionCount: questions,
                difficulty,
                timeLimitSeconds: timeLimit * 60,
                expiresInMinutes: Number(expiresInMinutes) || 60,
                sourceText,
                extraInstructions: instructions.trim() || undefined,
            };
            const genResp = await apiFetch("/api/v1/tests/generate", {
                method: "POST",
                body: payload,
            });
            if (!genResp || !genResp.code)
                throw new Error("Generation response missing test code.");
            setLastGeneratedCode(genResp.code);
            // optimistic local list entry (minimal fields until poll resolves)
            addLocalGeneratedTest({
                id: genResp.id,
                code: genResp.code,
                title: payload.title,
                createdAt: new Date().toISOString(),
                expiresAt: genResp.expiresAt,
            });
            // Poll endpoint for fully generated questions
            const full = await pollForQuestions(genResp.code, {});
            setPreviewTest(full);
            navigate("/preview");
        } catch (e) {
            if (e.name === "AbortError") return;
            console.error(e);
            setError(
                e instanceof ApiError
                    ? e.message
                    : e.message || "Generation failed"
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
        <div className="max-w-2xl mx-auto px-4 py-24 sm:py-32">
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">
                Create a New Test
            </h1>
            {step === 1 && (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center shadow-sm">
                    <h2 className="text-2xl font-semibold mb-2">
                        Step 1: Upload Source Material
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Upload a PDF, DOCX, or TXT file as a reference for the
                        AI.
                    </p>
                    <label
                        htmlFor="dropzone-file"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <IconUpload />
                            {fileName ? (
                                <>
                                    <p className="mb-2 text-sm text-green-600 font-semibold">
                                        {fileName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Click to change file
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">
                                            Click to upload
                                        </span>{" "}
                                        or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PDF, DOCX, TXT (MAX. 10MB)
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            id="dropzone-file"
                            type="file"
                            accept=".txt"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                    <Button
                        onClick={() => setStep(2)}
                        disabled={!fileName}
                        className="mt-8 w-full sm:w-auto"
                    >
                        Next: Set Parameters <IconArrowRight />
                    </Button>
                </div>
            )}
            {step === 2 && (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-semibold mb-6">
                        Step 2: Configure Test Parameters
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                maxLength={120}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter test title"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Additional Instructions (optional)
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) =>
                                    setInstructions(e.target.value)
                                }
                                rows={4}
                                placeholder="E.g., Emphasize definitions, avoid trick questions..."
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="questions"
                                className="block mb-2 text-sm font-medium text-gray-700"
                            >
                                Number of Questions
                            </label>
                            <input
                                id="questions"
                                type="range"
                                min="5"
                                max="50"
                                value={questions}
                                onChange={(e) =>
                                    setQuestions(Number(e.target.value))
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-sm text-gray-600 mt-1">
                                {questions} questions
                            </p>
                        </div>
                        <div>
                            <label
                                htmlFor="time"
                                className="block mb-2 text-sm font-medium text-gray-700"
                            >
                                Time Limit (minutes)
                            </label>
                            <input
                                id="time"
                                type="range"
                                min="10"
                                max="120"
                                value={timeLimit}
                                onChange={(e) =>
                                    setTimeLimit(Number(e.target.value))
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-sm text-gray-600 mt-1">
                                {timeLimit} minutes
                            </p>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Difficulty
                            </label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Expires In (minutes)
                            </label>
                            <input
                                type="number"
                                min={15}
                                max={1440}
                                value={expiresInMinutes}
                                onChange={(e) =>
                                    setExpiresInMinutes(e.target.value)
                                }
                                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                After this time the test may no longer be
                                accessible.
                            </p>
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 mt-4">
                                {error}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-8">
                        <Button onClick={() => setStep(1)} variant="secondary">
                            Back
                        </Button>
                        <div className="flex gap-3">
                            {isGenerating && (
                                <Button
                                    variant="secondary"
                                    onClick={handleAbort}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                            >
                                {isGenerating
                                    ? "Generating..."
                                    : "Preview Test"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
