import { logger } from "../config/logger.js";

export function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        const ms = Date.now() - start;
        logger.info(
            {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                ms,
            },
            "req"
        );
    });
    next();
}
