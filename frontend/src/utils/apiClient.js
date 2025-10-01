// Simple API client with automatic JSON, auth header, refresh rotation
import { getTokenStore } from "../contexts/tokenStore";

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function parseJSON(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export class ApiError extends Error {
    constructor(message, status, data, code) {
        super(message);
        this.status = status;
        this.data = data;
        this.code = code;
    }
}

// Map backend error codes to user-friendly messages (extend as needed)
export function mapErrorCode(code, fallback) {
    if (!code) return fallback;
    const table = {
        FORBIDDEN_ATTEMPT_DETAIL: "You can't view that attempt yet.",
        ATTEMPT_NOT_SUBMITTED: "Attempt not submitted yet.",
        TEST_CLOSED: "This test is closed.",
        TEST_EXPIRED: "This test has expired.",
    };
    return table[code] || fallback;
}

export async function apiFetch(
    path,
    { method = "GET", body, retry = true, headers = {} } = {}
) {
    const tokens = getTokenStore();
    const access = tokens.getAccessToken();
    const reqHeaders = { "Content-Type": "application/json", ...headers };
    if (access) reqHeaders.Authorization = `Bearer ${access}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && retry && tokens.getRefreshToken()) {
        // attempt refresh then retry once
        const refreshed = await attemptRefresh(tokens);
        if (refreshed) {
            return apiFetch(path, { method, body, retry: false, headers });
        }
    }

    const data = await parseJSON(res);
    if (!res.ok) {
        // Standard envelope { error: { code, message, details } }
        let message = "Request failed";
        let code = undefined;
        if (data && typeof data === "object") {
            if (data.error) {
                const err = data.error;
                message = err.message || err.code || message;
                code = err.code;
            } else if (data.message) {
                message = data.message;
            }
        }
        throw new ApiError(message, res.status, data, code);
    }
    return data;
}

async function attemptRefresh(tokens) {
    try {
        const refreshToken = tokens.getRefreshToken();
        if (!refreshToken) return false;
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        tokens.setTokens(json.accessToken, json.refreshToken, json.user);
        return true;
    } catch {
        tokens.clear();
        return false;
    }
}
