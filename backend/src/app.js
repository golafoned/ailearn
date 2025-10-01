import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { getDb } from "./db/index.js";
import authRoutes from "./routes/authRoutes.js";
import testsRoutes from "./routes/testsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";

export async function createApp() {
    await getDb(); // ensure DB & migrations ready
    const app = express();
    app.use(helmet());
    app.use(cors({ origin: "*" })); // adjust in production
    app.use(express.json());
    app.use(requestLogger);

    app.get("/health", (req, res) =>
        res.json({ status: "ok", env: env.nodeEnv })
    );
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/tests", testsRoutes);
    app.use("/api/v1/users", usersRoutes);

    app.use(notFound);
    app.use(errorHandler);

    app.on("close", () => logger.info("App closing"));
    return app;
}

export default createApp;
