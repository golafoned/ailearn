import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        displayName: z.string().min(1).max(50).optional(),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(10),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const generateTestSchema = z.object({
    body: z.object({
        title: z.string().min(3),
        questionCount: z.number().int().min(1).max(50),
        difficulty: z.enum(['easy','medium','hard']).default('medium'),
        timeLimitSeconds: z.number().int().min(30).max(7200),
        expiresInMinutes: z.number().int().min(5).max(60*24*30),
        extraInstructions: z.string().max(2000).optional(),
        sourceText: z.string().min(10),
        filename: z.string().optional(),
        params: z.record(z.any()).optional()
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough()
});

export const startAttemptSchema = z.object({
    body: z.object({
        code: z.string().min(4),
        participantName: z.string().min(1).max(80),
        displayName: z.string().min(1).max(80).optional()
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough()
});

export const submitAttemptSchema = z.object({
    body: z.object({
        attemptId: z.string().uuid(),
        answers: z.array(z.object({ questionId: z.string(), answer: z.string().nullable() })).min(1)
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough()
});

export const updateMeSchema = z.object({
    body: z.object({
        displayName: z.string().min(1).max(50)
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough()
});
