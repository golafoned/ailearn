/**
 * Simple test to directly check database persistence
 */
import { getDb, saveDb } from "./src/db/index.js";

async function test() {
    console.log("Getting database...");
    const db = await getDb();

    const userId = "da447d2d-bfed-4e3a-a493-4f55762b91f5";

    // Check current count
    const before = db.exec(
        `SELECT COUNT(*) FROM user_concepts WHERE user_id = '${userId}';`
    );
    console.log("Concepts BEFORE:", before[0]?.values[0]?.[0] || 0);

    // Add a test concept
    db.exec(`INSERT INTO user_concepts (
        id, user_id, concept_name, mastery_level,
        total_attempts, correct_attempts, difficulty_level,
        consecutive_correct, consecutive_wrong,
        last_practiced_at, next_review_due, created_at
    ) VALUES (
        'test-concept-123', '${userId}', 'Test Concept', 50,
        10, 5, 'medium',
        0, 0,
        datetime('now'), datetime('now', '+3 days'), datetime('now')
    );`);

    // Check after insert
    const after = db.exec(
        `SELECT COUNT(*) FROM user_concepts WHERE user_id = '${userId}';`
    );
    console.log("Concepts AFTER insert:", after[0]?.values[0]?.[0] || 0);

    // Save to disk
    console.log("\nSaving to disk...");
    await saveDb();
    console.log("Save completed!");

    // Wait and exit
    await new Promise((resolve) => setTimeout(resolve, 500));
    process.exit(0);
}

test().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
