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
        navigate("/create", { state: { topic: topic.trim() } });
    };

    const handleJoinTest = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        navigate(`/attempt/${joinCode.trim()}`);
    };

    return (
        <div className="relative isolate overflow-hidden min-h-screen flex items-center justify-center text-center px-6 pt-20 sm:pt-24 lg:px-8">
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
            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
                    Master Any Topic with AI-Powered Practice
                </h1>
                <p className="mt-4 text-xl leading-8 text-gray-600 mb-10">
                    Generate highly effective practice tests instantly from any topic or file.
                    Learn faster through spaced repetition and adaptive questions.
                </p>

                <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 space-y-8">
                    {/* Quick Practice Form */}
                    <form onSubmit={handleQuickPractice} className="relative max-w-xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="What do you want to learn? (e.g. Python OOP)"
                                className="w-full px-5 py-4 text-base bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                            />
                            <Button 
                                type="submit" 
                                className="px-8 py-4 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white shadow-md w-full sm:w-auto text-base"
                            >
                                Practice <IconArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </form>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-300/60"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                        <div className="flex-grow border-t border-gray-300/60"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {/* Join by Code Form */}
                        <form onSubmit={handleJoinTest} className="flex gap-2">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter Test Code"
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Button type="submit" variant="secondary" className="whitespace-nowrap px-6">
                                Join
                            </Button>
                        </form>

                        {/* Login/Dashboard CTA */}
                        {isAuthenticated ? (
                            <Button onClick={() => navigate("/dashboard")} variant="secondary" className="w-full justify-center py-3">
                                Go to Dashboard →
                            </Button>
                        ) : (
                            <Button onClick={() => navigate("/login")} variant="secondary" className="w-full justify-center py-3 border-blue-200 hover:bg-blue-50 text-blue-700">
                                Sign In / Register
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
