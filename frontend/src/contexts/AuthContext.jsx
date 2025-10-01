import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
} from "react";
import { apiFetch, ApiError } from "../utils/apiClient";
import { getTokenStore } from "./tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Ensure stable token store instance (getTokenStore returns a new wrapper each call)
    const tokenStoreRef = useRef(null);
    if (!tokenStoreRef.current) tokenStoreRef.current = getTokenStore();
    const tokenStore = tokenStoreRef.current;
    const [user, setUser] = useState(tokenStore.getUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(
        async ({ email, password }) => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiFetch("/api/v1/auth/login", {
                    method: "POST",
                    body: { email, password },
                });
                tokenStore.setTokens(
                    data.accessToken,
                    data.refreshToken,
                    data.user
                );
                setUser(data.user);
                return data.user;
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Login failed");
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [tokenStore]
    );

    const register = useCallback(
        async ({ email, password, displayName }) => {
            setLoading(true);
            setError(null);
            try {
                await apiFetch("/api/v1/auth/register", {
                    method: "POST",
                    body: { email, password, displayName },
                });
                // auto-login after register
                return await login({ email, password });
            } catch (e) {
                setError(
                    e instanceof ApiError ? e.message : "Registration failed"
                );
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [login]
    );

    const logout = useCallback(async () => {
        try {
            if (tokenStore.getAccessToken()) {
                await apiFetch("/api/v1/auth/logout", { method: "POST" }).catch(
                    () => {}
                );
            }
        } finally {
            tokenStore.clear();
            setUser(null);
        }
    }, [tokenStore]);

    const refreshUser = useCallback(async () => {
        try {
            const data = await apiFetch("/api/v1/auth/me");
            setUser(data.user);
            return data.user;
        } catch {
            return null;
        }
    }, []);

    // Initial hydration (run once)
    useEffect(() => {
        let isMounted = true;
        const store = tokenStoreRef.current;
        async function hydrate() {
            if (!store.getAccessToken()) return;
            try {
                const data = await apiFetch("/api/v1/auth/me");
                if (isMounted) setUser(data.user);
            } catch {
                store.clear();
                if (isMounted) setUser(null);
            }
        }
        hydrate();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
                loading,
                error,
                clearError: () => setError(null),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
