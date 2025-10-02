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
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        timeLimitSeconds: z.number().int().min(30).max(7200),
        expiresInMinutes: z
            .number()
            .int()
            .min(5)
            .max(60 * 24 * 30),
        extraInstructions: z.string().max(2000).optional(),
        sourceText: z.string().min(10),
        filename: z.string().optional(),
        params: z.record(z.any()).optional(),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const startAttemptSchema = z.object({
    body: z.object({
        code: z.string().min(4),
        participantName: z.string().min(1).max(80).optional(),
        displayName: z.string().min(1).max(80).optional(),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const submitAttemptSchema = z.object({
    body: z.object({
        attemptId: z.string().uuid(),
        answers: z
            .array(
                z.object({
                    questionId: z.string(),
                    answer: z.string().nullable(),
                })
            )
            .min(1),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const reviewGenerateSchema = z.object({
    body: z
        .object({
            strategy: z
                .enum(["wrong_recent", "spaced_repetition", "mix"])
                .default("wrong_recent"),
            baseTestId: z.string().uuid().optional(),
            attemptId: z.string().uuid().optional(),
            questionCount: z.number().int().min(1).max(40).default(8),
            variantMode: z
                .enum(["variant", "exact", "adaptive"])
                .default("variant"),
        })
        .refine((data) => data.attemptId || data.baseTestId, {
            message: "Either attemptId or baseTestId required",
            path: ["attemptId"],
        }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const updateMeSchema = z.object({
    body: z.object({
        displayName: z.string().min(1).max(50),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

// Learning API schemas
export const sessionCreateSchema = z.object({
    body: z.object({
        sessionType: z.enum([
            "quick_practice",
            "focused_practice",
            "mastery_check",
            "weak_concepts",
        ]),
        conceptSelection: z
            .enum(["due", "weak", "random", "custom"])
            .default("due"),
        customConcepts: z.array(z.string()).optional(),
        targetDifficulty: z
            .enum(["easy", "medium", "hard", "adaptive"])
            .default("adaptive"),
        questionCount: z.number().int().min(5).max(50).default(10),
    }),
    query: z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

export const sessionCompleteSchema = z.object({
    body: z.object({
        answers: z
            .array(
                z.object({
                    questionId: z.string(),
                    answer: z.string(),
                })
            )
            .min(1),
        timeSpent: z.number().int().min(0),
    }),
    query: z.object({}).passthrough(),
    params: z
        .object({
            sessionId: z.string().uuid(),
        })
        .passthrough(),
});

export const conceptFilterSchema = z.object({
    body: z.object({}).optional().default({}),
    query: z
        .object({
            filter: z
                .enum(["all", "weak", "mastered", "learning", "due"])
                .optional()
                .default("all"),
            sort: z
                .enum(["mastery", "name", "recent", "due"])
                .optional()
                .default("mastery"),
            limit: z
                .string()
                .regex(/^\d+$/)
                .optional()
                .default("50")
                .transform(Number),
            offset: z
                .string()
                .regex(/^\d+$/)
                .optional()
                .default("0")
                .transform(Number),
        })
        .passthrough(),
    params: z.object({}).passthrough(),
});

export const progressChartSchema = z.object({
    body: z.object({}).optional().default({}),
    query: z
        .object({
            period: z
                .enum(["week", "month", "quarter"])
                .optional()
                .default("month"),
        })
        .passthrough(),
    params: z.object({}).passthrough(),
});
