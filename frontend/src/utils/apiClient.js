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
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
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
    if (!res.ok)
        throw new ApiError(data?.error || "Request failed", res.status, data);
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
