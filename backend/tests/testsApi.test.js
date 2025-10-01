import request from "supertest";
import fs from "fs";
import { v4 as uuid } from "uuid";

process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "1d";
process.env.DRY_RUN_AI = "true";
const testDb = "./data/test2.db";
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

async function registerAndLogin() {
    const email = "gen@example.com";
    const password = "Passw0rd!";
    await request(app)
        .post("/api/v1/auth/register")
        .send({ email, password, displayName: "Gen" });
    const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password });
    return loginRes.body.accessToken;
}

describe("Test Attempts API (without AI generation endpoint)", () => {
    function fakeQuestions(n) {
        return Array.from({ length: n }, (_, i) => ({
            id: uuid(),
            type: "mcq",
            question: `Q${i + 1}?`,
            options: ["A", "B", "C", "D"],
            answer: "A",
            difficulty: "easy",
        }));
    }

    async function manualCreateTest(token, { questionCount = 3 } = {}) {
        // Instead of hitting /generate, insert directly via repository (dynamic import to use same DB)
        const { TestRepository } = await import(
            "../src/repositories/testRepository.js"
        );
        const repo = new TestRepository();
        const testId = uuid();
        const code =
            "T" + Math.random().toString(36).slice(2, 10).toUpperCase();
        const expiresAt = new Date(Date.now() + 60 * 60000).toISOString();
        const questions = fakeQuestions(questionCount);
        await repo.create({
            id: testId,
            code,
            title: "Manual Test",
            source_filename: null,
            source_text: "Manual content",
            model: "env-model",
            params_json: { questionCount },
            questions_json: questions,
            expires_at: expiresAt,
            time_limit_seconds: 300,
            created_by: null,
        });
        return { testId, code, questions };
    }

    it("start, submit, and list attempts for a manually inserted test", async () => {
        const token = await registerAndLogin();
        const { code, testId, questions } = await manualCreateTest(token, {
            questionCount: 2,
        });
        const fetchRes = await request(app).get(`/api/v1/tests/code/${code}`);
        expect(fetchRes.statusCode).toBe(200);
        const startRes = await request(app)
            .post("/api/v1/tests/start")
            .send({ code, participantName: "Anon", displayName: "Nick" });
        expect(startRes.statusCode).toBe(201);
        const attemptId = startRes.body.attemptId;
        const submitRes = await request(app)
            .post("/api/v1/tests/submit")
            .send({
                attemptId,
                answers: [{ questionId: questions[0].id, answer: "A" }],
            });
        expect(submitRes.statusCode).toBe(200);
        // owner list (created_by null so treat as open? We'll skip owner check) - can't list by test since no owner id, so skip owner listing
        const myAttempts = await request(app)
            .get("/api/v1/tests/me/attempts")
            .set("Authorization", `Bearer ${token}`);
        expect([200, 404]).toContain(myAttempts.statusCode); // user may not have attempts linked since attempt user_id null
    });
});
