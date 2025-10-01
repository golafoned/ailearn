import request from "supertest";
import fs from "fs";
import { v4 as uuid } from "uuid";

process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "1d";
process.env.DRY_RUN_AI = "true";
const testDb = "./data/test_errors.db";
process.env.DB_FILE = testDb;

let app; let createApp; let closeDb;

beforeAll(async () => {
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  ({ createApp } = await import("../src/app.js"));
  ({ closeDb } = await import("../src/db/index.js"));
  app = await createApp();
});

// Note: jest.setTimeout not available in this ESM setup; keep tests lean so default is fine.

afterAll(async () => { if (closeDb) await closeDb(); });

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

async function createManualTest({ ownerId, questionCount = 1, expiresPast = false }) {
  const { TestRepository } = await import("../src/repositories/testRepository.js");
  const repo = new TestRepository();
  const testId = uuid();
  const code = "T" + Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires_at = new Date(Date.now() + (expiresPast ? -60000 : 3600000)).toISOString();
  const questions = fakeQuestions(questionCount);
  await repo.create({
    id: testId,
    code,
    title: "Err Test",
    source_filename: null,
    source_text: "Manual",
    model: "env-model",
    params_json: { questionCount },
    questions_json: questions,
    expires_at,
    time_limit_seconds: 120,
    created_by: ownerId,
  });
  return { testId, code, questions };
}

describe("Standardized error responses", () => {
  test("invalid refresh token returns standardized error", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken: "badbadbadbad" });
    expect([400,401]).toContain(res.status); // 400 if validation, 401 if passes schema
    if (res.status === 400) {
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    } else {
      expect(res.body).toHaveProperty("error.code", "INVALID_REFRESH_TOKEN");
    }
  });

  test("forbidden attempts listing when not owner", async () => {
    await request(app).post("/api/v1/auth/register").send({ email: "o@e.com", password: "Passw0rd!" });
    const loginOwner = await request(app).post("/api/v1/auth/login").send({ email: "o@e.com", password: "Passw0rd!" });
    const tokenOwner = loginOwner.body.accessToken;
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${tokenOwner}`);
    const ownerId = me.body.user.id;
    const { testId } = await createManualTest({ ownerId });
    await request(app).post("/api/v1/auth/register").send({ email: "x@e.com", password: "Passw0rd!" });
    const login2 = await request(app).post("/api/v1/auth/login").send({ email: "x@e.com", password: "Passw0rd!" });
    const token2 = login2.body.accessToken;
    const list = await request(app).get(`/api/v1/tests/${testId}/attempts`).set("Authorization", `Bearer ${token2}`);
    expect(list.status).toBe(403);
    expect(list.body).toHaveProperty("error.code", "FORBIDDEN_TEST_ATTEMPTS_LIST");
  });

  test("duplicate submit returns error code", async () => {
    await request(app).post("/api/v1/auth/register").send({ email: "d@e.com", password: "Passw0rd!" });
    const loginOwner = await request(app).post("/api/v1/auth/login").send({ email: "d@e.com", password: "Passw0rd!" });
    const tokenOwner = loginOwner.body.accessToken;
    const meOwner = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${tokenOwner}`);
    const ownerId = meOwner.body.user.id;
    const { code, questions } = await createManualTest({ ownerId, questionCount: 1 });

    await request(app).post("/api/v1/auth/register").send({ email: "dup@e.com", password: "Passw0rd!" });
    const loginU = await request(app).post("/api/v1/auth/login").send({ email: "dup@e.com", password: "Passw0rd!" });
    const tokenU = loginU.body.accessToken;
    const start = await request(app).post("/api/v1/tests/start").set("Authorization", `Bearer ${tokenU}`).send({ code });
    const attemptId = start.body.attemptId;

    const submit1 = await request(app)
      .post("/api/v1/tests/submit")
      .set("Authorization", `Bearer ${tokenU}`)
      .send({ attemptId, answers: [{ questionId: questions[0].id, answer: "A" }] });
    expect(submit1.status).toBe(200);
    const submit2 = await request(app)
      .post("/api/v1/tests/submit")
      .set("Authorization", `Bearer ${tokenU}`)
      .send({ attemptId, answers: [{ questionId: questions[0].id, answer: "A" }] });
    expect(submit2.status).toBe(400);
    expect(submit2.body).toHaveProperty("error.code", "ALREADY_SUBMITTED");
  });

  test("expired test start returns gone code", async () => {
    await request(app).post("/api/v1/auth/register").send({ email: "e@e.com", password: "Passw0rd!" });
    const loginOwner = await request(app).post("/api/v1/auth/login").send({ email: "e@e.com", password: "Passw0rd!" });
    const tokenOwner = loginOwner.body.accessToken;
    const meOwner = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${tokenOwner}`);
    const ownerId = meOwner.body.user.id;
    const { code } = await createManualTest({ ownerId, expiresPast: true });
    await request(app).post("/api/v1/auth/register").send({ email: "ex@e.com", password: "Passw0rd!" });
    const loginU = await request(app).post("/api/v1/auth/login").send({ email: "ex@e.com", password: "Passw0rd!" });
    const tokenU = loginU.body.accessToken;
    const start = await request(app).post("/api/v1/tests/start").set("Authorization", `Bearer ${tokenU}`).send({ code });
    expect(start.status).toBe(410); // already expired
    expect(start.body).toHaveProperty("error.code", "TEST_EXPIRED");
  });
});
