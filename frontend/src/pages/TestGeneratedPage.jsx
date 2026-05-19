import React, { useState, useMemo } from "react";
import { Button } from "../components/Button";
import { IconCopy, IconCheck } from "../components/Icons";
import { copyToClipboard } from "../utils/clipboard";
import { useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";

export function TestGeneratedPage() {
    const { previewTest, lastGeneratedCode } = useTestData();
    const code = previewTest?.code || lastGeneratedCode || "unknown";
    const testLink = useMemo(
        () => `${window.location.origin}/code/${code}`,
        [code],
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

    return (
        <div className="max-w-2xl mx-auto px-4 py-24 sm:py-32 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
                Your Test is Ready!
            </h1>
            <p className="text-gray-500 mb-8">
                Share the link or code below so others can take this test.
            </p>

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

            <div className="mt-8 flex gap-4 justify-center flex-wrap">
                {previewTest && (
                    <Button
                        onClick={() => navigate("/preview")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        👁️ Preview Test
                    </Button>
                )}
                {previewTest?.id && (
                    <Button
                        onClick={() =>
                            navigate(`/tests/${previewTest.id}/analytics`)
                        }
                        variant="secondary"
                    >
                        📊 View Analytics
                    </Button>
                )}
                <Button
                    onClick={() => navigate("/my-tests")}
                    variant="secondary"
                >
                    Back to My Tests
                </Button>
            </div>
        </div>
    );
}
