// Lightweight token store decoupled from React for use in utilities.
let accessToken = null;
let refreshToken = null;
let user = null;

function load() {
    try {
        const raw = localStorage.getItem("auth");
        if (raw) {
            const parsed = JSON.parse(raw);
            accessToken = parsed.accessToken || null;
            refreshToken = parsed.refreshToken || null;
            user = parsed.user || null;
        }
    } catch {
        /* ignore load errors */
    }
}
load();

function persist() {
    try {
        if (!accessToken && !refreshToken) {
            localStorage.removeItem("auth");
        } else {
            localStorage.setItem(
                "auth",
                JSON.stringify({ accessToken, refreshToken, user })
            );
        }
    } catch {
        /* ignore persist errors */
    }
}

export function getTokenStore() {
    return {
        getAccessToken: () => accessToken,
        getRefreshToken: () => refreshToken,
        getUser: () => user,
        setTokens: (at, rt, u) => {
            accessToken = at;
            refreshToken = rt;
            user = u;
            persist();
        },
        clear: () => {
            accessToken = null;
            refreshToken = null;
            user = null;
            persist();
        },
    };
}
