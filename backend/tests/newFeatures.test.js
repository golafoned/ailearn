import request from 'supertest';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

process.env.JWT_ACCESS_SECRET = "testaccesssecret_testaccesssecret_";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret_testrefreshsecret_";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.JWT_REFRESH_EXPIRES = "1d";
process.env.DRY_RUN_AI = "true";
const testDb = './data/test_new_features.db';
process.env.DB_FILE = testDb;

let app; let createApp; let closeDb;

beforeAll(async () => {
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  ({ createApp } = await import('../src/app.js'));
  ({ closeDb } = await import('../src/db/index.js'));
  app = await createApp();
});

afterAll(async () => { if (closeDb) await closeDb(); });

function fakeQuestions(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(),
    type: 'mcq',
    question: `NF Q${i+1}?`,
    options: ['A','B','C','D'],
    answer: 'A',
    difficulty: 'easy'
  }));
}

async function manualTest(ownerId, { questionCount=3, expired=false }={}) {
  const { TestRepository } = await import('../src/repositories/testRepository.js');
  const repo = new TestRepository();
  const id = uuid();
  const code = 'T' + Math.random().toString(36).slice(2,10).toUpperCase();
  const expires_at = new Date(Date.now() + (expired ? -60000 : 3600000)).toISOString();
  const questions = fakeQuestions(questionCount);
  await repo.create({ id, code, title: 'NF Test', source_filename: null, source_text: 'Manual', model: 'env-model', params_json: {questionCount}, questions_json: questions, expires_at, time_limit_seconds: 300, created_by: ownerId });
  return { id, code, questions };
}

async function register(email) {
  const password = 'Passw0rd!';
  await request(app).post('/api/v1/auth/register').send({ email, password });
  const login = await request(app).post('/api/v1/auth/login').send({ email, password });
  return { token: login.body.accessToken, password, email };
}

describe('New feature endpoints', () => {
  test('attempt detail hides correct answers for participant but shows correctness', async () => {
    const owner = await register('nf_owner@example.com');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${owner.token}`);
    const { id: testId, code, questions } = await manualTest(me.body.user.id, {questionCount:2});
    const participant = await register('nf_participant@example.com');
    const start = await request(app).post('/api/v1/tests/start').send({ code });
    const attemptId = start.body.attemptId;
    await request(app).post('/api/v1/tests/submit').send({ attemptId, answers: [{ questionId: questions[0].id, answer:'A' }, { questionId: questions[1].id, answer:'B' }] });
    // Link attempt to participant user by starting with auth (new attempt)
    const start2 = await request(app).post('/api/v1/tests/start').set('Authorization', `Bearer ${participant.token}`).send({ code });
    const attemptId2 = start2.body.attemptId;
    await request(app).post('/api/v1/tests/submit').set('Authorization', `Bearer ${participant.token}`).send({ attemptId: attemptId2, answers: [{ questionId: questions[0].id, answer:'A' }, { questionId: questions[1].id, answer:'C' }] });
    const detail = await request(app).get(`/api/v1/tests/attempt/${attemptId2}`).set('Authorization', `Bearer ${participant.token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.answers[0]).toHaveProperty('correct');
    expect(detail.body.answers[0]).not.toHaveProperty('correctAnswer');
  });

  test('owner attempt detail shows correct answers', async () => {
    const owner = await register('nf_owner2@example.com');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${owner.token}`);
    const { id: testId, code, questions } = await manualTest(me.body.user.id, {questionCount:2});
    const start = await request(app).post('/api/v1/tests/start').send({ code });
    const attemptId = start.body.attemptId;
    await request(app).post('/api/v1/tests/submit').send({ attemptId, answers: [{ questionId: questions[0].id, answer:'A' }, { questionId: questions[1].id, answer:'D' }] });
    const ownerDetail = await request(app).get(`/api/v1/tests/${testId}/attempts/${attemptId}`).set('Authorization', `Bearer ${owner.token}`);
    expect(ownerDetail.status).toBe(200);
    expect(ownerDetail.body.answers[0]).toHaveProperty('correctAnswer');
  });

  test('leaderboard returns ordered scores', async () => {
    const owner = await register('nf_owner3@example.com');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${owner.token}`);
    const { id: testId, code, questions } = await manualTest(me.body.user.id, {questionCount:2});
    // three attempts with varying performance
    const a1 = await request(app).post('/api/v1/tests/start').send({ code });
    await request(app).post('/api/v1/tests/submit').send({ attemptId: a1.body.attemptId, answers: questions.map(q=>({ questionId: q.id, answer:'A'})) }); // 100%
    const a2 = await request(app).post('/api/v1/tests/start').send({ code });
    await request(app).post('/api/v1/tests/submit').send({ attemptId: a2.body.attemptId, answers: [{ questionId: questions[0].id, answer:'A'}] }); // partial, one answered
    const a3 = await request(app).post('/api/v1/tests/start').send({ code });
    await request(app).post('/api/v1/tests/submit').send({ attemptId: a3.body.attemptId, answers: questions.map(q=>({ questionId: q.id, answer:'B'})) }); // 0%
    const lb = await request(app).get(`/api/v1/tests/${testId}/leaderboard?limit=2`);
    expect(lb.status).toBe(200);
    expect(lb.body.leaderboard.length).toBe(2);
    expect(lb.body.leaderboard[0].score).toBeGreaterThanOrEqual(lb.body.leaderboard[1].score);
  });

  test('close test prevents new starts', async () => {
    const owner = await register('nf_owner4@example.com');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${owner.token}`);
    const { id: testId, code } = await manualTest(me.body.user.id, {questionCount:1});
    const closeRes = await request(app).post(`/api/v1/tests/${testId}/close`).set('Authorization', `Bearer ${owner.token}`);
    expect(closeRes.status).toBe(200);
    const start = await request(app).post('/api/v1/tests/start').send({ code });
    expect([400,410]).toContain(start.status); // Expired path -> 410 (preferred)
  });
});
