import fs from "fs";

export function loadDatabase(dbFile) {
    if (fs.existsSync(dbFile)) {
        return fs.readFileSync(dbFile);
    }
    return null;
}

export function persistDatabase(dbFile, SQL, db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFile, buffer);
}
