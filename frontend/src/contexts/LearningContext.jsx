import React, { createContext, useContext, useState, useCallback } from "react";
import { apiFetch, ApiError } from "../utils/apiClient";
import { useToast } from "./ToastContext";

const LearningContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useLearning() {
    const context = useContext(LearningContext);
    if (!context) {
        throw new Error("useLearning must be used within LearningProvider");
    }
    return context;
}

export function LearningProvider({ children }) {
    const toast = useToast();

    // Dashboard state
    const [dashboardData, setDashboardData] = useState(null);
    const [concepts, setConcepts] = useState([]);
    const [weakConcepts, setWeakConcepts] = useState([]);
    const [dueReviews, setDueReviews] = useState(null);
    const [progressChart, setProgressChart] = useState(null);
    const [achievements, setAchievements] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [conceptDetails, setConceptDetails] = useState(null);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [conceptsLoading, setConceptsLoading] = useState(false);

    // Current session state
    const [currentSession, setCurrentSession] = useState(null);

    // ==================== Dashboard APIs ====================

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/api/v1/learning/dashboard");
            setDashboardData(data);
            return data;
        } catch (e) {
            const msg =
                e instanceof ApiError ? e.message : "Failed to load dashboard";
            toast.error(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchConcepts = useCallback(
        async ({ filter = "all", sort = "mastery", limit, offset } = {}) => {
            setConceptsLoading(true);
            try {
                const params = new URLSearchParams();
                if (filter) params.append("filter", filter);
                if (sort) params.append("sort", sort);
                if (limit) params.append("limit", limit);
                if (offset) params.append("offset", offset);

                const data = await apiFetch(
                    `/api/v1/learning/concepts?${params}`
                );
                setConcepts(data.concepts || []);
                return data;
            } catch (e) {
                const msg =
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load concepts";
                toast.error(msg);
                throw e;
            } finally {
                setConceptsLoading(false);
            }
        },
        [toast]
    );

    const fetchConceptDetails = useCallback(
        async (conceptName) => {
            try {
                const data = await apiFetch(
                    `/api/v1/learning/concepts/${encodeURIComponent(
                        conceptName
                    )}/details`
                );
                setConceptDetails(data.concept);
                return data.concept;
            } catch (e) {
                const msg =
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load concept details";
                toast.error(msg);
                throw e;
            }
        },
        [toast]
    );

    const fetchWeakConcepts = useCallback(async () => {
        try {
            const data = await apiFetch("/api/v1/learning/weak-concepts");
            setWeakConcepts(data.weakConcepts || []);
            return data;
        } catch (e) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : "Failed to load weak concepts";
            toast.error(msg);
            throw e;
        }
    }, [toast]);

    const fetchDueReviews = useCallback(async () => {
        try {
            const data = await apiFetch("/api/v1/learning/due-reviews");
            setDueReviews(data);
            return data;
        } catch (e) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : "Failed to load due reviews";
            toast.error(msg);
            throw e;
        }
    }, [toast]);

    const fetchProgressChart = useCallback(
        async (period = "month") => {
            try {
                const data = await apiFetch(
                    `/api/v1/learning/progress-chart?period=${period}`
                );
                setProgressChart(data);
                return data;
            } catch (e) {
                const msg =
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load progress chart";
                toast.error(msg);
                throw e;
            }
        },
        [toast]
    );

    // ==================== Practice Session APIs ====================

    const createSession = useCallback(
        async ({
            sessionType,
            conceptSelection,
            customConcepts,
            difficulty,
            questionCount,
        }) => {
            try {
                const data = await apiFetch(
                    "/api/v1/learning/sessions/create",
                    {
                        method: "POST",
                        body: {
                            sessionType,
                            conceptSelection,
                            customConcepts,
                            difficulty,
                            questionCount,
                        },
                    }
                );
                setCurrentSession(data);
                toast.success(
                    `✨ Created ${sessionType} session with ${data.questionCount} questions!`
                );
                return data;
            } catch (e) {
                const msg =
                    e instanceof ApiError
                        ? e.message
                        : "Failed to create session";
                toast.error(msg);
                throw e;
            }
        },
        [toast]
    );

    const completeSession = useCallback(
        async (sessionId, answers, timeSpent) => {
            try {
                const data = await apiFetch(
                    `/api/v1/learning/sessions/${sessionId}/complete`,
                    {
                        method: "POST",
                        body: {
                            answers,
                            timeSpent,
                        },
                    }
                );
                toast.success(`🎉 Session complete! Score: ${data.score}%`);
                setCurrentSession(null);
                return data;
            } catch (e) {
                const msg =
                    e instanceof ApiError
                        ? e.message
                        : "Failed to complete session";
                toast.error(msg);
                throw e;
            }
        },
        [toast]
    );

    const adaptDifficulty = useCallback(
        async (sessionId, currentQuestionIndex, recentAnswers) => {
            try {
                const data = await apiFetch(
                    "/api/v1/learning/adapt-difficulty",
                    {
                        method: "POST",
                        body: {
                            sessionId,
                            currentQuestionIndex,
                            recentAnswers,
                        },
                    }
                );
                return data;
            } catch (e) {
                // Silent failure - not critical
                console.error("Failed to adapt difficulty:", e);
                return null;
            }
        },
        []
    );

    const fetchSessionHistory = useCallback(
        async ({ limit = 20, offset = 0 } = {}) => {
            try {
                const params = new URLSearchParams({ limit, offset });
                const data = await apiFetch(
                    `/api/v1/learning/sessions/history?${params}`
                );
                setSessionHistory(data.sessions || []);
                return data;
            } catch (e) {
                const msg =
                    e instanceof ApiError
                        ? e.message
                        : "Failed to load session history";
                toast.error(msg);
                throw e;
            }
        },
        [toast]
    );

    // ==================== Achievements & Recommendations ====================

    const fetchAchievements = useCallback(async () => {
        try {
            const data = await apiFetch("/api/v1/learning/achievements");
            setAchievements(data);
            return data;
        } catch (e) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : "Failed to load achievements";
            toast.error(msg);
            throw e;
        }
    }, [toast]);

    const fetchRecommendations = useCallback(async () => {
        try {
            const data = await apiFetch("/api/v1/learning/recommendations");
            setRecommendations(data.recommendations || []);
            return data;
        } catch (e) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : "Failed to load recommendations";
            toast.error(msg);
            throw e;
        }
    }, [toast]);

    // ==================== Utility Functions ====================

    const refreshDashboard = useCallback(async () => {
        await Promise.all([
            fetchDashboard(),
            fetchConcepts(),
            fetchWeakConcepts(),
            fetchDueReviews(),
            fetchRecommendations(),
        ]);
    }, [
        fetchDashboard,
        fetchConcepts,
        fetchWeakConcepts,
        fetchDueReviews,
        fetchRecommendations,
    ]);

    const value = {
        // State
        dashboardData,
        concepts,
        weakConcepts,
        dueReviews,
        progressChart,
        achievements,
        recommendations,
        sessionHistory,
        conceptDetails,
        currentSession,
        loading,
        conceptsLoading,

        // Actions
        fetchDashboard,
        fetchConcepts,
        fetchConceptDetails,
        fetchWeakConcepts,
        fetchDueReviews,
        fetchProgressChart,
        createSession,
        completeSession,
        adaptDifficulty,
        fetchSessionHistory,
        fetchAchievements,
        fetchRecommendations,
        refreshDashboard,

        // Setters
        setCurrentSession,
    };

    return (
        <LearningContext.Provider value={value}>
            {children}
        </LearningContext.Provider>
    );
}
