import React, { useState } from "react";
import { Button } from "../components/Button";
import { IconArrowRight } from "../components/Icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [topic, setTopic] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const handleQuickPractice = (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        if (isAuthenticated) {
            navigate("/learning/start", { state: { topic: topic.trim() } });
        } else {
            navigate("/register", { state: { topic: topic.trim() } });
        }
    };

    const handleJoinTest = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        navigate(`/code/${joinCode.trim()}`);
    };

    const features = [
        {
            emoji: "🤖",
            title: "AI-Powered Tests",
            desc: "Generate practice tests on any topic instantly",
        },
        {
            emoji: "🃏",
            title: "Flashcards",
            desc: "Study with AI-generated flashcards and spaced repetition",
        },
        {
            emoji: "📊",
            title: "Adaptive Learning",
            desc: "AI adjusts difficulty based on your mastery level",
        },
        {
            emoji: "🏆",
            title: "Track Progress",
            desc: "Earn achievements and watch your knowledge grow",
        },
        {
            emoji: "🔄",
            title: "Spaced Repetition",
            desc: "Review at optimal intervals for long-term retention",
        },
        {
            emoji: "📚",
            title: "Concept Mastery",
            desc: "Deep-dive into individual concepts with targeted practice",
        },
    ];

    return (
        <div className="relative isolate overflow-hidden min-h-screen">
            {/* Background decoration */}
            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
            >
                <div
                    className="relative left-1/2 aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-indigo-300 opacity-30 sm:left-1/2 sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                ></div>
            </div>

            {/* Hero Section */}
            <div className="flex items-center justify-center text-center px-6 pt-28 sm:pt-36 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
                        Master Any Topic with
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {" "}
                            AI-Powered Learning
                        </span>
                    </h1>
                    <p className="mt-4 text-xl leading-8 text-gray-600 mb-10 max-w-2xl mx-auto">
                        Practice tests, flashcards, and adaptive study sessions
                        — all powered by AI. Learn faster through spaced
                        repetition and smart feedback.
                    </p>

                    <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 space-y-8 max-w-2xl mx-auto">
                        {/* Quick Practice Form */}
                        <form
                            onSubmit={handleQuickPractice}
                            className="relative"
                        >
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="What do you want to learn? (e.g. Python OOP, React Hooks)"
                                    className="w-full px-5 py-4 text-base bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                                />
                                <Button
                                    type="submit"
                                    className="px-8 py-4 whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md w-full sm:w-auto text-base"
                                >
                                    Start Learning{" "}
                                    <IconArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </form>

                        <div className="relative flex items-center py-1">
                            <div className="flex-grow border-t border-gray-300/60"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">
                                OR
                            </span>
                            <div className="flex-grow border-t border-gray-300/60"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Join by Code */}
                            <form
                                onSubmit={handleJoinTest}
                                className="flex gap-2 sm:col-span-2"
                            >
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) =>
                                        setJoinCode(e.target.value)
                                    }
                                    placeholder="Enter Test Code"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    className="whitespace-nowrap px-6"
                                >
                                    Join
                                </Button>
                            </form>

                            {isAuthenticated ? (
                                <Button
                                    onClick={() => navigate("/learning")}
                                    variant="secondary"
                                    className="w-full justify-center py-3"
                                >
                                    📚 My Learning →
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => navigate("/login")}
                                    variant="secondary"
                                    className="w-full justify-center py-3 border-blue-200 hover:bg-blue-50 text-blue-700"
                                >
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
                    Everything you need to learn effectively
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <span className="text-4xl mb-3 block">
                                {f.emoji}
                            </span>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                                {f.title}
                            </h3>
                            <p className="text-gray-600 text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA for non-authenticated */}
            {!isAuthenticated && (
                <div className="max-w-2xl mx-auto px-6 pb-20 text-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                        <h2 className="text-2xl font-bold mb-2">
                            Ready to start learning?
                        </h2>
                        <p className="text-blue-100 mb-6">
                            Create a free account to track your progress, earn
                            achievements, and unlock all features.
                        </p>
                        <Button
                            onClick={() => navigate("/register")}
                            className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 text-base font-semibold"
                        >
                            Get Started Free
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
