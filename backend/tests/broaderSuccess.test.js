import request from "supertest";
import fs from "fs";

process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "5m";
process.env.JWT_REFRESH_EXPIRES = "1d";
process.env.DRY_RUN_AI = "true";
const testDb = "./data/test_broader.db";
process.env.DB_FILE = testDb;

let app;
let createApp;
let closeDb;

beforeAll(async () => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    ({ createApp } = await import("../src/app.js"));
    ({ closeDb } = await import("../src/db/index.js"));
    app = await createApp();
});

afterAll(async () => {
    if (closeDb) await closeDb();
});

async function register(email, displayName) {
    const password = "Passw0rd!";
    await request(app)
        .post("/api/v1/auth/register")
        .send({ email, password, displayName });
    const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password });
    return {
        token: login.body.accessToken,
        refresh: login.body.refreshToken,
        password,
    };
}

describe("Broader success flows", () => {
    it("refresh rotation returns new tokens", async () => {
        const { token, refresh } = await register(
            "rotate@example.com",
            "Rotator"
        );
        const res = await request(app)
            .post("/api/v1/auth/refresh")
            .send({ refreshToken: refresh });
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
    });

    it("logout revokes refresh tokens", async () => {
        const { token, refresh } = await register(
            "logout@example.com",
            "Logger"
        );
        const me = await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${token}`);
        expect(me.statusCode).toBe(200);
        const logout = await request(app)
            .post("/api/v1/auth/logout")
            .set("Authorization", `Bearer ${token}`);
        expect(logout.statusCode).toBe(200);
        // old refresh should now fail
        const ref = await request(app)
            .post("/api/v1/auth/refresh")
            .send({ refreshToken: refresh });
        expect(ref.statusCode).toBeGreaterThanOrEqual(400);
    });
});
