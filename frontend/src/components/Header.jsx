import React, { useState } from "react";
import { IconLogo, IconUser } from "./Icons";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export function Header() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => location.pathname.startsWith(path);

    const navLink = (path, label, emoji) => (
        <button
            onClick={() => { navigate(path); setMobileOpen(false); }}
            className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive(path)
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
        >
            {emoji && <span className="mr-1">{emoji}</span>}{label}
        </button>
    );

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

                {/* Mobile menu button */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            {navLink("/learning", "Learning", "📚")}
                            {navLink("/flashcards", "Flashcards", "🃏")}
                            {navLink("/dashboard", "Dashboard", "")}
                            {navLink("/learning/achievements", "Achievements", "🏆")}
                            <button
                                onClick={() => navigate("/profile")}
                                className={`p-2 rounded-lg transition-colors ${
                                    isActive("/profile")
                                        ? "text-blue-700 bg-blue-50"
                                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                }`}
                                title="Profile"
                            >
                                <IconUser />
                            </button>
                            <Button
                                onClick={() => { logout(); navigate("/"); }}
                                variant="secondary"
                                className="px-4 py-2 text-sm ml-1"
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

            {/* Mobile nav */}
            {mobileOpen && (
                <div className="sm:hidden mt-3 pb-2 border-t border-gray-200 pt-3 space-y-1">
                    {isAuthenticated ? (
                        <>
                            {navLink("/learning", "Learning", "📚")}
                            {navLink("/flashcards", "Flashcards", "🃏")}
                            {navLink("/dashboard", "Dashboard", "")}
                            {navLink("/learning/achievements", "Achievements", "🏆")}
                            {navLink("/profile", "Profile", "")}
                            <button
                                onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}
                                className="w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { navigate("/login"); setMobileOpen(false); }}
                                className="w-full text-left text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => { navigate("/register"); setMobileOpen(false); }}
                                className="w-full text-left text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
                            >
                                Register
                            </button>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
