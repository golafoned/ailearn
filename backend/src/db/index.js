import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { loadDatabase, persistDatabase } from "./sqljs-storage.js";

let SQL; // wasm module
let db; // Database instance
let initialized = false;

async function init() {
    if (initialized) return;
    // Initialize sql.js WASM module (default resolution). If performance becomes an issue, consider adding locateFile with ESM-compatible path resolution.
    SQL = await initSqlJs({});
    const dbPath = path.resolve(env.dbFile);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const fileData = loadDatabase(dbPath);
    db = fileData
        ? new SQL.Database(new Uint8Array(fileData))
        : new SQL.Database();
    runMigrations();
    persistDatabase(dbPath, SQL, db);
    // periodic persistence (lightweight) every 5s
    setInterval(() => {
        try {
            persistDatabase(dbPath, SQL, db);
        } catch (e) {
            logger.error(e, "Persist fail");
        }
    }, 5000).unref();
    initialized = true;
}

export async function getDb() {
    if (!initialized) await init();
    return db;
}

function exec(sql) {
    db.exec(sql);
}

export function runMigrations() {
    const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");
    exec(
        `CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, run_at TEXT NOT NULL);`
    );
    const appliedRes = db.exec("SELECT name FROM migrations");
    const applied = new Set(appliedRes[0]?.values.map((v) => v[0]) || []);
    const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        logger.info({ migration: file }, "Running migration");
        db.exec("BEGIN TRANSACTION;");
        try {
            db.exec(sql); // execute entire script; semicolons inside script handled by sql.js
            const now = new Date().toISOString();
            db.exec(
                `INSERT INTO migrations (name, run_at) VALUES ('${file.replace(
                    /'/g,
                    "''"
                )}', '${now}')`
            );
            db.exec("COMMIT;");
        } catch (e) {
            db.exec("ROLLBACK;");
            throw e;
        }
    }
}

export async function closeDb() {
    if (initialized) {
        const dbPath = path.resolve(env.dbFile);
        persistDatabase(dbPath, SQL, db);
        db.close();
        initialized = false;
    }
}
