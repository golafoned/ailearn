import { getDb } from "./src/db/index.js";

async function check() {
    const db = await getDb();
    const r = db.exec(
        `SELECT concept_name FROM user_concepts WHERE id = 'test-concept-123';`
    );
    console.log(
        "Test concept found:",
        r[0]?.values?.length > 0 ? "YES - " + r[0].values[0][0] : "NO"
    );

    const userId = "da447d2d-bfed-4e3a-a493-4f55762b91f5";
    const count = db.exec(
        `SELECT COUNT(*) FROM user_concepts WHERE user_id = '${userId}';`
    );
    console.log("Total concepts for user1:", count[0]?.values[0]?.[0] || 0);

    process.exit(0);
}

check();
