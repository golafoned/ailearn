/**
 * Verify database seeding worked correctly
 */
import { getDb } from "./src/db/index.js";

async function verify() {
    const db = await getDb();
    const userId = "da447d2d-bfed-4e3a-a493-4f55762b91f5";

    console.log("=== DATABASE VERIFICATION ===\n");

    // Check user
    const userRes = db.exec(
        `SELECT id, email FROM users WHERE id = '${userId}';`
    );
    if (userRes && userRes.length && userRes[0].values.length) {
        console.log("✅ User found:", userRes[0].values[0][1]);
    } else {
        console.log("❌ User NOT found");
        process.exit(1);
    }

    // Check concepts count
    const countRes = db.exec(
        `SELECT COUNT(*) FROM user_concepts WHERE user_id = '${userId}';`
    );
    const conceptCount = countRes[0]?.values[0]?.[0] || 0;
    console.log("📚 Total concepts:", conceptCount);

    if (conceptCount > 0) {
        // List all concepts
        const conceptsRes = db.exec(
            `SELECT concept_name, mastery_level, next_review_due FROM user_concepts WHERE user_id = '${userId}' ORDER BY mastery_level DESC;`
        );
        console.log("\n📋 All Concepts:");
        conceptsRes[0].values.forEach((row) => {
            console.log(`  - ${row[0]}: ${row[1]}% (Next review: ${row[2]})`);
        });

        // Check due concepts
        const dueRes = db.exec(
            `SELECT COUNT(*) FROM user_concepts WHERE user_id = '${userId}' AND next_review_due <= datetime('now', '+1 days');`
        );
        console.log(
            "\n📅 Due for review (next 24h):",
            dueRes[0]?.values[0]?.[0] || 0
        );

        // Check weak concepts
        const weakRes = db.exec(
            `SELECT COUNT(*) FROM user_concepts WHERE user_id = '${userId}' AND mastery_level < 60;`
        );
        console.log(
            "🔻 Weak concepts (<60%):",
            weakRes[0]?.values[0]?.[0] || 0
        );

        // Check practice history
        const historyRes = db.exec(
            `SELECT COUNT(*) FROM concept_practice_history WHERE user_id = '${userId}';`
        );
        console.log(
            "\n📊 Practice history records:",
            historyRes[0]?.values[0]?.[0] || 0
        );

        // Check sessions
        const sessionsRes = db.exec(
            `SELECT COUNT(*) FROM practice_sessions WHERE user_id = '${userId}';`
        );
        console.log(
            "🎯 Practice sessions:",
            sessionsRes[0]?.values[0]?.[0] || 0
        );

        // Check achievements
        const achievementsRes = db.exec(
            `SELECT COUNT(*) FROM user_achievements WHERE user_id = '${userId}';`
        );
        console.log(
            "🏆 Achievements:",
            achievementsRes[0]?.values[0]?.[0] || 0
        );

        console.log("\n✅ Database is properly seeded!");
        console.log("\n💡 Try these API calls:");
        console.log("   GET  /api/v1/learning/concepts");
        console.log("   GET  /api/v1/learning/weak-concepts");
        console.log("   GET  /api/v1/learning/due-reviews");
        console.log("   POST /api/v1/learning/sessions/create");
        console.log(
            '        Body: { "sessionType": "quick_practice", "conceptSelection": "weak", "questionCount": 5 }'
        );
    } else {
        console.log("\n❌ NO CONCEPTS FOUND!");
        console.log("💡 Run the SQL script to seed the database:");
        console.log("   sqlite3 data/app.db < seed-data.sql");
    }

    process.exit(0);
}

verify().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
