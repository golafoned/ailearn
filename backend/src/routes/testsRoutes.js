import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { generateTestSchema, startAttemptSchema, submitAttemptSchema } from '../utils/schemas.js';
import { generateTest, getTestByCode, startAttempt, submitAttempt, listTestAttempts, listMyAttempts } from '../controllers/testController.js';

const router = Router();

// Generation requires auth (for now)
router.post('/generate', requireAuth, validate(generateTestSchema), generateTest);
// Public fetch metadata & question shells
router.get('/code/:code', getTestByCode);
// Start attempt (anonymous allowed)
router.post('/start', validate(startAttemptSchema), startAttempt);
// Submit answers
router.post('/submit', validate(submitAttemptSchema), submitAttempt);
// Owner view attempts for a test
router.get('/:testId/attempts', requireAuth, listTestAttempts);
// User view own attempts
router.get('/me/attempts', requireAuth, listMyAttempts);

export default router;
