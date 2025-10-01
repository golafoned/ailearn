import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const rootDir = path.resolve(process.cwd());
const envPath = path.join(rootDir, ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

function required(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var ${name}`);
    return v;
}

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "4000", 10),
    jwt: {
        accessSecret: required("JWT_ACCESS_SECRET"),
        refreshSecret: required("JWT_REFRESH_SECRET"),
        accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
        refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
    },
    dbFile: process.env.DB_FILE || path.join(rootDir, "data", "app.db"),
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    },
    logLevel: process.env.LOG_LEVEL || "info",
};

export const isProd = env.nodeEnv === "production";
export const isTest = env.nodeEnv === "test";
