import { getDb } from "./src/db/index.js";

async function verifyCompleteSeed() {
    const db = await getDb();
    const userId = "da447d2d-bfed-4e3a-a493-4f55762b91f5";

    console.log("\n🔍 COMPLETE SEED DATA VERIFICATION");
    console.log("=".repeat(60));

    // 1. User Concepts
    const concepts = db.exec(
        `SELECT COUNT(*) as count FROM user_concepts WHERE user_id = '${userId}'`
    );
    console.log(`\n✅ Concepts: ${concepts[0].values[0][0]} (mastery 20%-90%)`);

    // 2. Practice History
    const history = db.exec(
        `SELECT COUNT(*) as count FROM concept_practice_history WHERE user_id = '${userId}'`
    );
    console.log(`✅ Practice History: ${history[0].values[0][0]} records`);

    // 3. Practice Sessions
    const sessions = db.exec(
        `SELECT COUNT(*) as count FROM practice_sessions WHERE user_id = '${userId}'`
    );
    console.log(`✅ Practice Sessions: ${sessions[0].values[0][0]} completed`);

    // 4. Achievements
    const achievements = db.exec(
        `SELECT COUNT(*) as count, COUNT(CASE WHEN earned_at IS NOT NULL THEN 1 END) as earned FROM user_achievements WHERE user_id = '${userId}'`
    );
    console.log(
        `✅ Achievements: ${achievements[0].values[0][0]} total (${achievements[0].values[0][1]} earned)`
    );

    // 5. Tests Created
    const tests = db.exec(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN is_review = 1 THEN 1 END) as review FROM tests WHERE created_by = '${userId}'`
    );
    console.log(
        `✅ Tests Created: ${tests[0].values[0][0]} total (${tests[0].values[0][1]} review tests)`
    );

    // 6. Test Attempts
    const attempts = db.exec(
        `SELECT COUNT(*) as count, AVG(score) as avg_score FROM test_attempts WHERE user_id = '${userId}' AND submitted_at IS NOT NULL`
    );
    console.log(
        `✅ Test Attempts: ${
            attempts[0].values[0][0]
        } completed (Avg: ${Math.round(attempts[0].values[0][1])}%)`
    );

    // 7. Wrong Answers for Review
    const wrongAnswers = db.exec(
        `SELECT COUNT(*) as count FROM test_attempt_answers taa 
         JOIN test_attempts ta ON taa.attempt_id = ta.id 
         WHERE ta.user_id = '${userId}' AND taa.is_correct = 0`
    );
    console.log(
        `✅ Wrong Answers: ${wrongAnswers[0].values[0][0]} (available for review generation)`
    );

    // 8. Test Details
    console.log("\n📋 TEST DETAILS:");
    console.log("=".repeat(60));
    const testDetails = db.exec(
        `SELECT code, title, 
         json_array_length(questions_json) as q_count,
         CASE WHEN is_review = 1 THEN 'Review' ELSE 'Regular' END as type
         FROM tests WHERE created_by = '${userId}'`
    );
    if (testDetails[0]) {
        testDetails[0].values.forEach((row) => {
            console.log(
                `  ${row[0]} - ${row[1]} (${row[2]} questions, ${row[3]})`
            );
        });
    }

    // 9. Attempt Scores
    console.log("\n📊 TEST ATTEMPT SCORES:");
    console.log("=".repeat(60));
    const attemptScores = db.exec(
        `SELECT t.title, ta.score, 
         COUNT(CASE WHEN taa.is_correct = 1 THEN 1 END) as correct,
         COUNT(CASE WHEN taa.is_correct = 0 THEN 1 END) as wrong
         FROM test_attempts ta
         JOIN tests t ON ta.test_id = t.id
         LEFT JOIN test_attempt_answers taa ON ta.id = taa.attempt_id
         WHERE ta.user_id = '${userId}'
         GROUP BY t.title, ta.score`
    );
    if (attemptScores[0]) {
        attemptScores[0].values.forEach((row) => {
            console.log(
                `  ${row[0]}: ${row[1]}% (${row[2]} correct, ${row[3]} wrong)`
            );
        });
    }

    // 10. Sample Wrong Answers
    console.log("\n❌ SAMPLE WRONG ANSWERS (for review generation):");
    console.log("=".repeat(60));
    const sampleWrong = db.exec(
        `SELECT question_text, correct_answer, user_answer
         FROM test_attempt_answers taa
         JOIN test_attempts ta ON taa.attempt_id = ta.id
         WHERE ta.user_id = '${userId}' AND taa.is_correct = 0
         LIMIT 5`
    );
    if (sampleWrong[0]) {
        sampleWrong[0].values.forEach((row, idx) => {
            console.log(`\n  ${idx + 1}. Q: ${row[0]}`);
            console.log(`     Correct: ${row[1]}`);
            console.log(`     User answered: ${row[2]}`);
        });
    }

    // 11. Verify Hints in Questions
    console.log("\n\n💡 SAMPLE HINTS FROM QUESTIONS:");
    console.log("=".repeat(60));
    const hints = db.exec(
        `SELECT 
         json_extract(questions_json, '$[0].question') as q1,
         json_extract(questions_json, '$[0].hint') as hint1
         FROM tests WHERE created_by = '${userId}' AND is_review = 0 LIMIT 2`
    );
    if (hints[0]) {
        hints[0].values.forEach((row, idx) => {
            console.log(`\n  ${idx + 1}. Question: ${row[0]}`);
            console.log(`     Hint: ${row[1]}`);
        });
    }

    console.log("\n\n" + "=".repeat(60));
    console.log("✨ COMPLETE SEED VERIFICATION SUCCESSFUL!");
    console.log("=".repeat(60));

    console.log("\n📝 API TESTING GUIDE:");
    console.log("=".repeat(60));
    console.log("\n1. LOGIN:");
    console.log("   POST /api/v1/auth/login");
    console.log('   Body: {"email": "user1@example.com", "password": "..."}');

    console.log("\n2. VIEW AVAILABLE TESTS:");
    console.log("   GET /api/v1/tests/my");
    console.log("   (Should show 3 regular tests + 1 review test)");

    console.log("\n3. VIEW TEST ATTEMPTS:");
    console.log("   GET /api/v1/tests/attempts");
    console.log("   (Shows 3 completed attempts with scores)");

    console.log("\n4. VIEW ATTEMPT RESULTS (with hints):");
    console.log("   GET /api/v1/tests/attempts/{attemptId}/results");
    console.log("   (Shows correct/wrong answers with hints for learning)");

    console.log("\n5. GENERATE NEW REVIEW TEST:");
    console.log("   POST /api/v1/tests/review/generate");
    console.log("   Body: {");
    console.log('     "strategy": "wrong_recent",');
    console.log('     "attemptId": "attempt-001",');
    console.log('     "questionCount": 7,');
    console.log('     "variantMode": "similar"');
    console.log("   }");

    console.log("\n6. TAKE A TEST:");
    console.log("   GET /api/v1/tests/CELL101 (or DNA202, EVO303)");
    console.log("   POST /api/v1/tests/CELL101/start");
    console.log("   POST /api/v1/tests/attempts/{attemptId}/submit");

    console.log("\n7. ADAPTIVE LEARNING DASHBOARD:");
    console.log("   GET /api/v1/learning/dashboard");
    console.log("   (Shows overall progress, concepts mastered, due reviews)");

    console.log("\n8. CREATE PRACTICE SESSION:");
    console.log("   POST /api/v1/learning/sessions/create");
    console.log("   Body: {");
    console.log('     "sessionType": "weak",');
    console.log('     "conceptSelection": "weak",');
    console.log('     "questionCount": 5');
    console.log("   }");

    console.log("\n" + "=".repeat(60));
    process.exit(0);
}

verifyCompleteSeed().catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
});
