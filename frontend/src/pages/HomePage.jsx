import React from "react";
import { Button } from "../components/Button";
import { IconArrowRight } from "../components/Icons";
import { useNavigate } from "react-router-dom";

export function HomePage() {
    const navigate = useNavigate();
    return (
        <div className="relative isolate overflow-hidden min-h-screen flex items-center justify-center text-center px-6 pt-20 sm:pt-24 lg:px-8">
            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                aria-hidden="true"
            >
                <div
                    className="relative left-1/2 aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-400 to-pink-300 opacity-20 sm:left-1/2 sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                ></div>
            </div>
            <div className="mx-auto max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    Generate Assessments Instantly with AI
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    Upload your reference materials, set your parameters, and
                    let our AI create tailored tests for your students or team.
                    Save time, ensure quality.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Button onClick={() => navigate("/login")}>
                        Get Started <IconArrowRight />
                    </Button>
                    <Button
                        onClick={() =>
                            alert("This would lead to a test entry page.")
                        }
                        variant="secondary"
                    >
                        Join a Test
                    </Button>
                </div>
            </div>
        </div>
    );
}
