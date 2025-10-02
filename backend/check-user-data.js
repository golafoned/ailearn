/**
 * Check user data in database
 */
import { getDb } from "./src/db/index.js";

async function checkData() {
    const db = await getDb();
    const userId = "da447d2d-bfed-4e3a-a493-4f55762b91f5";

    console.log("Checking data for user:", userId);
    console.log("Database file:", process.env.DB_FILE || "./data/app.db");
    console.log("");

    // Check user exists
    const userRes = db.exec(
        `SELECT id, email, display_name FROM users WHERE id = '${userId}';`
    );
    if (userRes && userRes.length && userRes[0].values.length) {
        const user = userRes[0].values[0];
        console.log("✅ User found:", user[1]);
    } else {
        console.log("❌ User NOT found");
        process.exit(1);
    }

    // Check concepts
    const conceptsRes = db.exec(
        `SELECT COUNT(*) as count FROM user_concepts WHERE user_id = '${userId}';`
    );
    const conceptCount = conceptsRes[0]?.values[0]?.[0] || 0;
    console.log("📚 Concepts:", conceptCount);

    if (conceptCount > 0) {
        const conceptList = db.exec(
            `SELECT concept_name, mastery_level FROM user_concepts WHERE user_id = '${userId}' ORDER BY mastery_level DESC LIMIT 5;`
        );
        console.log("\nTop 5 Concepts:");
        conceptList[0].values.forEach((row) => {
            console.log(`  - ${row[0]}: ${row[1]}%`);
        });
    }

    // Check practice history
    const historyRes = db.exec(
        `SELECT COUNT(*) FROM concept_practice_history WHERE user_id = '${userId}';`
    );
    console.log(
        "\n📊 Practice History Records:",
        historyRes[0]?.values[0]?.[0] || 0
    );

    // Check sessions
    const sessionsRes = db.exec(
        `SELECT COUNT(*) FROM practice_sessions WHERE user_id = '${userId}';`
    );
    console.log("🎯 Practice Sessions:", sessionsRes[0]?.values[0]?.[0] || 0);

    // Check tests
    const testsRes = db.exec(
        `SELECT COUNT(*) FROM tests WHERE created_by = '${userId}';`
    );
    console.log("📝 Tests:", testsRes[0]?.values[0]?.[0] || 0);

    // Check achievements
    const achievementsRes = db.exec(
        `SELECT COUNT(*) FROM user_achievements WHERE user_id = '${userId}';`
    );
    console.log("🏆 Achievements:", achievementsRes[0]?.values[0]?.[0] || 0);

    console.log("");

    if (conceptCount === 0) {
        console.log("❌ NO CONCEPTS FOUND - Need to run seed script!");
        process.exit(1);
    } else {
        console.log("✅ User data looks good!");
    }
}

checkData()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });
