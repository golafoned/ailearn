import { ApiError } from "../utils/ApiError.js";

export function validate(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            req.validated = parsed;
            next();
        } catch (e) {
            next(
                ApiError.badRequest(
                    "VALIDATION_ERROR",
                    "Validation error",
                    e.errors
                )
            );
        }
    };
}
