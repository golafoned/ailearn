import React, { useState, useRef, useEffect } from "react";
import { IconLogo, IconUser } from "./Icons";
import { Button } from "./Button";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export function Header() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const isActive = (path) => location.pathname.startsWith(path);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setProfileOpen(false);
        setMobileOpen(false);
    }, [location.pathname]);

    const navLink = (path, label, emoji) => (
        <button
            onClick={() => {
                navigate(path);
                setMobileOpen(false);
            }}
            className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive(path)
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
        >
            {emoji && <span className="mr-1">{emoji}</span>}
            {label}
        </button>
    );

    return (
        <header className="fixed top-0 left-0 w-full z-20 p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link
                    to={isAuthenticated ? "/learning" : "/"}
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
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {mobileOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            {navLink("/learning", "Learn", "📚")}
                            {navLink("/flashcards", "Flashcards", "🃏")}
                            {navLink(
                                "/learning/achievements",
                                "Achievements",
                                "🏆",
                            )}
                            {/* Profile dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                        profileOpen ||
                                        isActive("/profile") ||
                                        isActive("/my-tests")
                                            ? "text-blue-700 bg-blue-50"
                                            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                    }`}
                                    title="Menu"
                                >
                                    <IconUser />
                                    <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                                        <button
                                            onClick={() => navigate("/profile")}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            👤 Profile
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate("/my-tests")
                                            }
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            📝 My Tests
                                        </button>
                                        <button
                                            onClick={() => navigate("/create")}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            ✏️ Create Test
                                        </button>
                                        <hr className="my-1 border-gray-200" />
                                        <button
                                            onClick={() => {
                                                logout();
                                                navigate("/");
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
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
                            {navLink("/learning", "Learn", "📚")}
                            {navLink("/flashcards", "Flashcards", "🃏")}
                            {navLink(
                                "/learning/achievements",
                                "Achievements",
                                "🏆",
                            )}
                            {navLink("/my-tests", "My Tests", "📝")}
                            {navLink("/create", "Create Test", "✏️")}
                            {navLink("/profile", "Profile", "👤")}
                            <button
                                onClick={() => {
                                    logout();
                                    navigate("/");
                                    setMobileOpen(false);
                                }}
                                className="w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    navigate("/login");
                                    setMobileOpen(false);
                                }}
                                className="w-full text-left text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/register");
                                    setMobileOpen(false);
                                }}
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
