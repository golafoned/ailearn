import { runMigrations } from "./index.js";
import { logger } from "../config/logger.js";

try {
    runMigrations();
    logger.info("Migrations completed");
    process.exit(0);
} catch (e) {
    logger.error(e, "Migration failed");
    process.exit(1);
}
