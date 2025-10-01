import request from 'supertest';
import createApp, { createApp as createAppNamed } from '../src/app.js';
import { v4 as uuid } from 'uuid';
import { TestRepository } from '../src/repositories/testRepository.js';
import { generateCode } from '../src/utils/inviteCode.js';

// Ensure test env dry-run
process.env.DRY_RUN_AI = 'true';

const testRepo = new TestRepository();

// Helper to register & login
async function authFlow(app, email) {
  const password = 'Passw0rd!';
  await request(app).post('/api/v1/auth/register').send({ email, password, displayName: email.split('@')[0] });
  const login = await request(app).post('/api/v1/auth/login').send({ email, password });
  return login.body.accessToken;
}

async function generateBaseTestDirect(ownerId, { questionCount = 3 } = {}) {
  const questions = Array.from({ length: questionCount }, (_, i) => ({
    id: uuid(),
    type: 'mcq',
    question: `Bio question ${i+1}?`,
    options: ['A','B','C','D'],
    answer: 'A',
    difficulty: 'easy',
    explanation: 'Explanation for biology concept',
    reference: 'Cells ref'
  }));
  const test = await testRepo.create({
    id: uuid(),
    code: generateCode(),
    title: 'Biology Basics',
    source_filename: null,
    source_text: 'Cells are the basic unit of life. Mitochondria produce energy. Ribosomes synthesize proteins.',
    model: 'dry-run',
    params_json: { dryRun: true },
    questions_json: questions,
    expires_at: new Date(Date.now()+30*60000).toISOString(),
    time_limit_seconds: 300,
    created_by: ownerId,
    is_review: 0,
    review_source_test_id: null,
    review_origin_attempt_ids: null,
    review_strategy: null
  });
  return { id: test.id, code: test.code };
}

async function startAndSubmit(app, code, answers, token) {
  const start = await request(app).post('/api/v1/tests/start').set('Authorization', 'Bearer '+token).send({ code });
  const attemptId = start.body.attemptId;
  await request(app).post('/api/v1/tests/submit').set('Authorization', 'Bearer '+token).send({ attemptId, answers });
  return attemptId;
}

describe('Review / Practice Generation', () => {
  let app;
  beforeAll(async () => { app = await createAppNamed(); });

  test('generate review test from wrong answers', async () => {
  const token = await authFlow(app, 'learner1@example.com');
  // decode token? we only stored user id in req.user during runtime; for direct repo create need user id.
  // Instead, fetch a shell of listing my tests after creation? Simpler: replicate minimal decode of JWT structure (header.payload.signature) - but easier: call an authenticated endpoint to retrieve attempts? We'll create base after extracting user id from token payload.
  const userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
  const base = await generateBaseTestDirect(userId, { questionCount: 3 });
    // Fetch test shell to get question ids
    const shell = await request(app).get('/api/v1/tests/code/'+base.code);
    const qIds = shell.body.questions.map(q=>q.id);
    // Submit attempt with two wrong answers (choose B while correct is A in dry run)
    const answers = qIds.map(id=>({ questionId: id, answer: 'B' }));
    const attemptId = await startAndSubmit(app, base.code, answers, token);
    const review = await request(app).post('/api/v1/tests/review').set('Authorization','Bearer '+token).send({ strategy:'wrong_recent', attemptId, questionCount: 4, variantMode:'variant' });
    expect(review.status).toBe(201);
    expect(review.body.isReview).toBe(true);
    expect(review.body.questionCount).toBe(4);
  }, 15000);

  test('review tests list and recommendations', async () => {
  const token = await authFlow(app, 'learner2@example.com');
  const userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
  const base = await generateBaseTestDirect(userId, { questionCount: 3 });
    const shell = await request(app).get('/api/v1/tests/code/'+base.code);
    const qIds = shell.body.questions.map(q=>q.id);
    const answers = qIds.map(id=>({ questionId: id, answer: 'B' }));
    const attemptId = await startAndSubmit(app, base.code, answers, token);
    await request(app).post('/api/v1/tests/review').set('Authorization','Bearer '+token).send({ strategy:'wrong_recent', attemptId, questionCount: 3 });
    const mine = await request(app).get('/api/v1/tests/review/mine').set('Authorization','Bearer '+token);
    expect(mine.status).toBe(200);
    expect(Array.isArray(mine.body.items)).toBe(true);
    const rec = await request(app).get('/api/v1/tests/review/recommendations').set('Authorization','Bearer '+token);
    expect(rec.status).toBe(200);
    expect(Array.isArray(rec.body.recommendations)).toBe(true);
  }, 15000);

  test('review start forbidden for non-owner', async () => {
  const tokenA = await authFlow(app, 'owner@example.com');
  const ownerId = JSON.parse(Buffer.from(tokenA.split('.')[1], 'base64').toString()).sub;
  const base = await generateBaseTestDirect(ownerId, { questionCount: 3 });
    const shell = await request(app).get('/api/v1/tests/code/'+base.code);
    const qIds = shell.body.questions.map(q=>q.id);
    const answers = qIds.map(id=>({ questionId: id, answer: 'B' }));
    const attemptId = await startAndSubmit(app, base.code, answers, tokenA);
    const review = await request(app).post('/api/v1/tests/review').set('Authorization','Bearer '+tokenA).send({ strategy:'wrong_recent', attemptId, questionCount: 2 });
    const tokenB = await authFlow(app, 'intruder@example.com');
    const forbidden = await request(app).post('/api/v1/tests/start').set('Authorization','Bearer '+tokenB).send({ code: review.body.code });
    expect(forbidden.status).toBe(403);
  }, 15000);
});
