import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const start = async () => {
    const app = await createApp();
    app.listen(env.port, () => logger.info(`Server listening on :${env.port}`));
};

start();
