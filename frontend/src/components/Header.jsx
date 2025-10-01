import React from "react";
import { IconLogo, IconUser } from "./Icons";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export function Header() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    return (
        <header className="fixed top-0 left-0 w-full z-20 p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link
                    to={isAuthenticated ? "/dashboard" : "/"}
                    className="flex items-center gap-2 text-gray-900"
                >
                    <IconLogo />
                    <span className="font-bold text-xl">TestGen AI</span>
                </Link>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => navigate("/profile")}
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <IconUser />
                            </button>
                            <Button
                                onClick={() => {
                                    logout();
                                    navigate("/");
                                }}
                                variant="secondary"
                                className="px-4 py-2 text-sm"
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="secondary"
                                className="px-4 py-2 text-sm"
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </Button>
                            <Button
                                className="px-4 py-2 text-sm"
                                onClick={() => navigate("/register")}
                            >
                                Register
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
