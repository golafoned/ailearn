import request from 'supertest';
import fs from 'fs';

process.env.JWT_ACCESS_SECRET = 'testaccesssecret_testaccesssecret_';
process.env.JWT_REFRESH_SECRET = 'testrefreshsecret_testrefreshsecret_';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '1d';
process.env.DRY_RUN_AI = 'true';
const testDb = './data/test2.db';
process.env.DB_FILE = testDb;

let app; let createApp; let closeDb;

beforeAll(async () => {
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  ({ createApp } = await import('../src/app.js'));
  ({ closeDb } = await import('../src/db/index.js'));
  app = await createApp();
});

afterAll(async () => { if (closeDb) await closeDb(); });

async function registerAndLogin() {
  const email = 'gen@example.com';
  const password = 'Passw0rd!';
  await request(app).post('/api/v1/auth/register').send({ email, password, displayName: 'Gen' });
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password });
  return loginRes.body.accessToken;
}

describe('Test Generation API', () => {
  it('generates a test (dry run) and starts attempt', async () => {
    const token = await registerAndLogin();
    const genRes = await request(app).post('/api/v1/tests/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sample Biology',
        questionCount: 3,
        difficulty: 'easy',
        timeLimitSeconds: 300,
        expiresInMinutes: 60,
        sourceText: 'Cells are the basic building blocks of life.',
        extraInstructions: 'Keep questions simple.'
      });
    expect(genRes.statusCode).toBe(201);
    const { code } = genRes.body;
    expect(code).toBeTruthy();

    const fetchRes = await request(app).get(`/api/v1/tests/code/${code}`);
    expect(fetchRes.statusCode).toBe(200);
    expect(fetchRes.body.questions.length).toBe(3);

    const startRes = await request(app).post('/api/v1/tests/start').send({ code, participantName: 'Anonymous' });
    expect(startRes.statusCode).toBe(201);
    const attemptId = startRes.body.attemptId;
    expect(attemptId).toBeTruthy();

    const submitRes = await request(app).post('/api/v1/tests/submit').send({ attemptId, answers: [{ questionId: fetchRes.body.questions[0].id, answer: 'A' }] });
    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body.attemptId).toBe(attemptId);
  });

  it('lists owner attempts and user attempts', async () => {
    const token = await registerAndLogin();
    const genRes = await request(app).post('/api/v1/tests/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Owner Test',
        questionCount: 2,
        difficulty: 'easy',
        timeLimitSeconds: 120,
        expiresInMinutes: 30,
        sourceText: 'Earth revolves around the Sun',
      });
    expect(genRes.statusCode).toBe(201);
    const { code, id: testId } = genRes.body;
    const fetchRes = await request(app).get(`/api/v1/tests/code/${code}`);
    const qId = fetchRes.body.questions[0].id;
    const startRes = await request(app).post('/api/v1/tests/start').send({ code, participantName: 'P1' });
    const attemptId = startRes.body.attemptId;
    await request(app).post('/api/v1/tests/submit').send({ attemptId, answers: [{ questionId: qId, answer: 'A' }] });

    // owner list
    const ownerList = await request(app).get(`/api/v1/tests/${testId}/attempts`).set('Authorization', `Bearer ${token}`);
    expect(ownerList.statusCode).toBe(200);
    expect(Array.isArray(ownerList.body.attempts)).toBe(true);
    expect(ownerList.body.attempts.length).toBeGreaterThanOrEqual(1);

    // user attempts list (auth user who generated not the participant unless same user id recorded)
    const myAttempts = await request(app).get('/api/v1/tests/me/attempts').set('Authorization', `Bearer ${token}`);
    expect(myAttempts.statusCode).toBe(200);
    expect(Array.isArray(myAttempts.body.attempts)).toBe(true);
  });
});
