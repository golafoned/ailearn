import { logger } from "../config/logger.js";
import { ApiError, mapUnknownError } from "../utils/ApiError.js";

export function notFound(req, res, next) {
    next(ApiError.notFound());
}

export function errorHandler(err, req, res, next) { // eslint-disable-line
    const apiErr = mapUnknownError(err);
    logger.error({ err: apiErr }, "Unhandled error");
    if (res.headersSent) return;
    const body = { error: { code: apiErr.code, message: apiErr.message } };
    if (apiErr.details !== undefined) body.error.details = apiErr.details;
    res.status(apiErr.status).json(body);
}
