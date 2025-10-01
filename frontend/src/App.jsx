import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateTestPage } from "./pages/CreateTestPage";
import { TestTakingPage } from "./pages/TestTakingPage";
import { TestGeneratedPage } from "./pages/TestGeneratedPage";
import { TestLandingPage } from "./pages/TestLandingPage";
import { ProfilePage } from "./pages/ProfilePage";
import { TestAnalyticsPage } from "./pages/TestAnalyticsPage";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
    return (
        <div className="bg-gray-50 text-gray-900 min-h-screen font-sans selection:bg-blue-500/20">
            <Header />
            <main className="pt-20">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <DashboardPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/create"
                        element={
                            <PrivateRoute>
                                <CreateTestPage />
                            </PrivateRoute>
                        }
                    />
                    {/* Public landing by code */}
                    <Route path="/code/:code" element={<TestLandingPage />} />
                    {/* Authenticated preview immediately after generation (still using TestTakingPage) */}
                    <Route
                        path="/preview"
                        element={
                            <PrivateRoute>
                                <TestTakingPage />
                            </PrivateRoute>
                        }
                    />
                    {/* Active attempt route (after starting) */}
                    <Route path="/attempt" element={<TestTakingPage />} />
                    <Route path="/generated" element={<TestGeneratedPage />} />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/tests/:id/analytics"
                        element={
                            <PrivateRoute>
                                <TestAnalyticsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}
