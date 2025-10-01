import request from "supertest";
import fs from "fs";
import { v4 as uuid } from "uuid";

process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "1d";
process.env.DRY_RUN_AI = "true";
const testDb = "./data/test_new_endpoints.db";
process.env.DB_FILE = testDb;

let app; let createApp; let closeDb;

beforeAll(async () => {
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  ({ createApp } = await import("../src/app.js"));
  ({ closeDb } = await import("../src/db/index.js"));
  app = await createApp();
});

afterAll(async () => { if (closeDb) await closeDb(); });

async function register(email, displayName) {
  const password = "Passw0rd!";
  await request(app).post("/api/v1/auth/register").send({ email, password, displayName });
  const login = await request(app).post("/api/v1/auth/login").send({ email, password });
  return { token: login.body.accessToken, password, email };
}

function fakeQuestions(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(), type: "mcq", question: `Q${i+1}?`, options: ["A","B","C","D"], answer: "A", difficulty: "easy"
  }));
}

async function manualCreateOwnedTest(ownerId, idx) {
  const { TestRepository } = await import("../src/repositories/testRepository.js");
  const repo = new TestRepository();
  const testId = uuid();
  const code = "T" + Math.random().toString(36).slice(2,10).toUpperCase();
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  const questions = fakeQuestions(2);
  await repo.create({
    id: testId,
    code,
    title: `Owned Test ${idx}`,
    source_filename: null,
    source_text: "Manual",
    model: "env-model",
    params_json: { questionCount: 2 },
    questions_json: questions,
    expires_at: expiresAt,
    time_limit_seconds: 300,
    created_by: ownerId,
  });
  return { testId, code, questions };
}

describe("New endpoint behaviors", () => {
  it("lists my tests with pagination", async () => {
    const { token } = await register("pageme@example.com", "PageUser");
    // capture user id
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    const userId = me.body.user.id;
    for (let i=0;i<15;i++) await manualCreateOwnedTest(userId, i+1);
    const page1 = await request(app).get("/api/v1/tests/mine?page=1&pageSize=10").set("Authorization", `Bearer ${token}`);
    expect(page1.statusCode).toBe(200);
    expect(page1.body.items.length).toBe(10);
    expect(page1.body.total).toBe(15);
    const page2 = await request(app).get("/api/v1/tests/mine?page=2&pageSize=10").set("Authorization", `Bearer ${token}`);
    expect(page2.statusCode).toBe(200);
    expect(page2.body.items.length).toBe(5);
  });

  it("auth start attempt ignores provided participantName", async () => {
    const { token } = await register("authstart@example.com", "RealName");
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    const userId = me.body.user.id;
  const { code, testId } = await manualCreateOwnedTest(userId, 1);
  const start = await request(app).post("/api/v1/tests/start").set("Authorization", `Bearer ${token}`).send({ code, participantName: "FakeName" });
    expect(start.statusCode).toBe(201);
    // list attempts as owner
    const ownerAttempts = await request(app).get(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${token}`);
    expect(ownerAttempts.statusCode).toBe(200);
    expect(ownerAttempts.body.attempts.length).toBe(1);
  expect(["RealName", me.body.user.email.split('@')[0]]).toContain(ownerAttempts.body.attempts[0].participantName);
  });

  it("public user endpoint returns user info", async () => {
    const { token } = await register("publicu@example.com", "PubUser");
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    const userId = me.body.user.id;
    // create a few tests to increase testsCount
    for (let i=0;i<3;i++) await manualCreateOwnedTest(userId, i+1);
    const pub = await request(app).get(`/api/v1/users/${userId}`);
    expect(pub.statusCode).toBe(200);
    expect(pub.body.user.id).toBe(userId);
    expect(pub.body.user.displayName).toBe("PubUser");
    expect(pub.body.user.testsCount).toBe(3);
  });

  it("secure submit prevents other user submitting someone else's attempt", async () => {
    const { token: ownerToken } = await register("ownerx@example.com", "OwnerX");
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${ownerToken}`);
    const ownerId = me.body.user.id;
    const { code, questions } = await manualCreateOwnedTest(ownerId, 1);
    // Start attempt authenticated (so user_id set)
    const start = await request(app).post("/api/v1/tests/start").set("Authorization", `Bearer ${ownerToken}`).send({ code });
    const attemptId = start.body.attemptId;
    // Another user tries to submit
    const { token: otherToken } = await register("intruder@example.com", "Intruder");
  const forbidden = await request(app).post("/api/v1/tests/submit").set("Authorization", `Bearer ${otherToken}`).send({ attemptId, answers: [{ questionId: questions[0].id, answer: "A" }] });
  expect([401,403]).toContain(forbidden.statusCode);
  expect(forbidden.body).toHaveProperty("error.code");
  });
});
