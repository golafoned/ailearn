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
import { AttemptDetailPage } from "./pages/AttemptDetailPage";
import { MyAttemptDetailPage } from "./pages/MyAttemptDetailPage";
import { ReviewTestLandingPage } from "./pages/ReviewTestLandingPage";
import { LearningDashboardPage } from "./pages/LearningDashboardPage";
import { PracticeSessionCreatePage } from "./pages/PracticeSessionCreatePage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { SessionResultsPage } from "./pages/SessionResultsPage";
import { ConceptDetailPage } from "./pages/ConceptDetailPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { FlashcardDeckPage } from "./pages/FlashcardDeckPage";
import { TopicStartPage } from "./pages/TopicStartPage";
import { StudentResultsPage } from "./pages/StudentResultsPage";
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

                    {/* Learning (primary flow) */}
                    <Route
                        path="/learning"
                        element={
                            <PrivateRoute>
                                <LearningDashboardPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/learning/start"
                        element={
                            <PrivateRoute>
                                <TopicStartPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/learning/practice/create"
                        element={
                            <PrivateRoute>
                                <PracticeSessionCreatePage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/learning/achievements"
                        element={
                            <PrivateRoute>
                                <AchievementsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/learning/session/results"
                        element={
                            <PrivateRoute>
                                <SessionResultsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/learning/concepts/:name"
                        element={
                            <PrivateRoute>
                                <ConceptDetailPage />
                            </PrivateRoute>
                        }
                    />

                    {/* Flashcards */}
                    <Route
                        path="/flashcards"
                        element={
                            <PrivateRoute>
                                <FlashcardsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/flashcards/:deckId"
                        element={
                            <PrivateRoute>
                                <FlashcardDeckPage />
                            </PrivateRoute>
                        }
                    />

                    {/* Test results for students */}
                    <Route path="/results" element={<StudentResultsPage />} />

                    {/* My Tests (secondary — test management) */}
                    <Route
                        path="/my-tests"
                        element={
                            <PrivateRoute>
                                <DashboardPage />
                            </PrivateRoute>
                        }
                    />
                    {/* Redirect old /dashboard to /my-tests */}
                    <Route
                        path="/dashboard"
                        element={<Navigate to="/my-tests" replace />}
                    />
                    <Route
                        path="/create"
                        element={
                            <PrivateRoute>
                                <CreateTestPage />
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
                    <Route
                        path="/tests/:testId/attempts/:attemptId"
                        element={
                            <PrivateRoute>
                                <AttemptDetailPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/attempts/:attemptId"
                        element={
                            <PrivateRoute>
                                <MyAttemptDetailPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/review-tests/:code"
                        element={
                            <PrivateRoute>
                                <ReviewTestLandingPage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/generated" element={<TestGeneratedPage />} />

                    {/* Public test routes */}
                    <Route path="/code/:code" element={<TestLandingPage />} />
                    <Route
                        path="/preview"
                        element={
                            <PrivateRoute>
                                <TestTakingPage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/attempt" element={<TestTakingPage />} />

                    {/* Profile */}
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <ProfilePage />
                            </PrivateRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}
