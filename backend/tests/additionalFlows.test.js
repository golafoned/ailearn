import request from "supertest";
import fs from "fs";
import { v4 as uuid } from "uuid";
// Note: jest.setTimeout is not available as a global in this ESM + experimental VM setup, so rely on per-test operations being fast.

process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "1d";
process.env.DRY_RUN_AI = "true";
const testDb = "./data/test3.db";
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

async function register(email, displayName = "User") {
    const password = "Passw0rd!";
    await request(app)
        .post("/api/v1/auth/register")
        .send({ email, password, displayName });
    return { email, password };
}
async function login(email, password) {
    const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password });
    return res.body.accessToken;
}

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

async function createManualTest({
    ownerId,
    questionCount = 2,
    expiresPast = false,
}) {
    const { TestRepository } = await import(
        "../src/repositories/testRepository.js"
    );
    const repo = new TestRepository();
    const testId = uuid();
    const code = "T" + Math.random().toString(36).slice(2, 10).toUpperCase();
    const expires_at = new Date(
        Date.now() + (expiresPast ? -60000 : 3600000)
    ).toISOString();
    const questions = fakeQuestions(questionCount);
    await repo.create({
        id: testId,
        code,
        title: "Flow Test",
        source_filename: null,
        source_text: "Manual content",
        model: "env-model",
        params_json: { questionCount },
        questions_json: questions,
        expires_at,
        time_limit_seconds: 300,
        created_by: ownerId,
    });
    return { testId, code, questions };
}

describe("Additional flow tests", () => {
    it("owner can list attempts; non-owner forbidden", async () => {
        // Owner create account
        const { email: e1, password: p1 } = await register(
            "owner@example.com",
            "Owner"
        );
        const ownerToken = await login(e1, p1);
        // Another user
        const { email: e2, password: p2 } = await register(
            "other@example.com",
            "Other"
        );
        const otherToken = await login(e2, p2);

        // Create test manually with created_by set to owner user id (extract from /me)
        const meRes = await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${ownerToken}`);
        const ownerId = meRes.body.user.id;
        const { code, testId, questions } = await createManualTest({ ownerId });

        // Start attempt anonymously and submit
        const startRes = await request(app)
            .post("/api/v1/tests/start")
            .send({ code, participantName: "Anon OwnerTest" });
        const attemptId = startRes.body.attemptId;
        await request(app)
            .post("/api/v1/tests/submit")
            .send({
                attemptId,
                answers: [{ questionId: questions[0].id, answer: "A" }],
            });

        // Owner list attempts
        const listRes = await request(app)
            .get(`/api/v1/tests/${testId}/attempts`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(listRes.statusCode).toBe(200);
        expect(listRes.body.attempts.length).toBe(1);

        // Non-owner should get 403
        const forb = await request(app)
            .get(`/api/v1/tests/${testId}/attempts`)
            .set("Authorization", `Bearer ${otherToken}`);
        expect(forb.statusCode).toBe(403);
    });

    it("duplicate submit blocked", async () => {
        const { email, password } = await register("dup@example.com", "Dup");
        const token = await login(email, password);
        const me = await request(app)
            .get("/api/v1/auth/me")
            .set("Authorization", `Bearer ${token}`);
        const { code, questions } = await createManualTest({
            ownerId: me.body.user.id,
        });
        const startRes = await request(app)
            .post("/api/v1/tests/start")
            .send({ code, participantName: "P" });
        const attemptId = startRes.body.attemptId;
        const submit1 = await request(app)
            .post("/api/v1/tests/submit")
            .send({
                attemptId,
                answers: [{ questionId: questions[0].id, answer: "A" }],
            });
        expect(submit1.statusCode).toBe(200);
        const submit2 = await request(app)
            .post("/api/v1/tests/submit")
            .send({
                attemptId,
                answers: [{ questionId: questions[0].id, answer: "A" }],
            });
        expect(submit2.statusCode).toBe(400);
    });

    it("expired test cannot start", async () => {
        const { email, password } = await register("exp@example.com", "Exp");
        await login(email, password); // token not needed for start
        const me = await request(app)
            .post("/api/v1/auth/login")
            .send({ email, password });
        const { code } = await createManualTest({
            ownerId: me.body.accessToken ? me.body.userId : null,
            expiresPast: true,
        });
        const startRes = await request(app)
            .post("/api/v1/tests/start")
            .send({ code, participantName: "Late" });
        expect(startRes.statusCode).toBe(410);
    });

    it("profile update works", async () => {
        const { email, password } = await register("upd@example.com", "Orig");
        const token = await login(email, password);
        const patchRes = await request(app)
            .patch("/api/v1/auth/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ displayName: "Changed" });
        expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.user.displayName).toBe("Changed");
    });
});
