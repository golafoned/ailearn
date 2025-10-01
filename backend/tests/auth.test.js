import request from "supertest";
import fs from "fs";

// set required env BEFORE importing app factory
process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "1d";
const testDb = "./data/test.db";
process.env.DB_FILE = testDb; // picked up when env module loads later

let app;
let createApp;
let closeDb;

beforeAll(async () => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    ({ closeDb } = await import("../src/db/index.js"));
    ({ createApp } = await import("../src/app.js"));
    app = await createApp();
}, 20000);

afterAll(async () => {
    if (closeDb) await closeDb();
});

describe("Auth flow", () => {
    const email = "user@example.com";
    const password = "Passw0rd!";

    it("registers a user", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .send({ email, password, displayName: "User" });
        expect(res.statusCode).toBe(201);
        expect(res.body.user).toHaveProperty("id");
        expect(res.body.user.email).toBe(email);
    });

    it("logs in user", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("refreshToken");
    });
});
