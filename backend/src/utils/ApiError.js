export class ApiError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        if (details !== undefined) this.details = details;
    }
    static badRequest(code, message, details) {
        return new ApiError(400, code || "BAD_REQUEST", message, details);
    }
    static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
        return new ApiError(401, code, message);
    }
    static forbidden(message = "Forbidden", code = "FORBIDDEN") {
        return new ApiError(403, code, message);
    }
    static notFound(message = "Not Found", code = "NOT_FOUND") {
        return new ApiError(404, code, message);
    }
    static conflict(message = "Conflict", code = "CONFLICT") {
        return new ApiError(409, code, message);
    }
    static gone(message = "Gone", code = "GONE") {
        return new ApiError(410, code, message);
    }
    static tooMany(message = "Too Many Requests", code = "RATE_LIMITED") {
        return new ApiError(429, code, message);
    }
    static internal(
        message = "Internal Server Error",
        code = "INTERNAL_SERVER_ERROR",
        details
    ) {
        return new ApiError(500, code, message, details);
    }
    // Convenience wrappers for new feature domain
    static generationIncomplete(message = "Generation incomplete", code = "GENERATION_INCOMPLETE") {
        return new ApiError(500, code, message);
    }
    static reviewInvalidContext(message = "Invalid review context", code = "REVIEW_INVALID_CONTEXT") {
        return new ApiError(400, code, message);
    }
    static reviewStrategyUnsupported(message = "Unsupported review strategy", code = "REVIEW_STRATEGY_UNSUPPORTED") {
        return new ApiError(400, code, message);
    }
    static reviewGenerationFailed(message = "Review generation failed", code = "REVIEW_GENERATION_FAILED") {
        return new ApiError(500, code, message);
    }
}

export function mapUnknownError(err) {
    if (err instanceof ApiError) return err;
    return ApiError.internal(err.message || undefined);
}
