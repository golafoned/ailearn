/**
 * Database Seeding Script for Existing User
 * Seeds data for user: user1@example.com (da447d2d-bfed-4e3a-a493-4f55762b91f5)
 */

import { getDb, saveDb } from "./src/db/index.js";
import { v4 as uuid } from "uuid";

// Helper function to escape single quotes for SQL
function esc(str) {
    if (str === null || str === undefined) return "NULL";
    return `'${String(str).replace(/'/g, "''")}'`;
}

async function seedUserData() {
    console.log("🌱 Starting database seeding for user1@example.com...\n");
    const db = await getDb();

    const userId = "da447d2d-bfed-4e3a-a493-4f55762b91f5";

    try {
        // Verify user exists
        const userCheck = db.exec(
            `SELECT id, email FROM users WHERE id = ${esc(userId)};`
        );
        if (!userCheck || !userCheck.length || !userCheck[0].values.length) {
            throw new Error(
                "User not found! Please make sure user1@example.com exists."
            );
        }
        console.log("✅ User verified: user1@example.com\n");

        // Clean up existing data for this user
        console.log("🗑️  Cleaning up existing data...");
        db.exec(
            `DELETE FROM concept_practice_history WHERE user_id = ${esc(
                userId
            )};`
        );
        db.exec(`DELETE FROM user_concepts WHERE user_id = ${esc(userId)};`);
        db.exec(
            `DELETE FROM practice_sessions WHERE user_id = ${esc(userId)};`
        );
        db.exec(
            `DELETE FROM user_achievements WHERE user_id = ${esc(userId)};`
        );
        db.exec(`DELETE FROM test_attempts WHERE user_id = ${esc(userId)};`);
        db.exec(`DELETE FROM tests WHERE created_by = ${esc(userId)};`);
        console.log("✅ Old data cleaned\n");

        // 1. Create concepts with varying mastery levels
        console.log("📚 Creating user concepts with mastery levels...");
        const concepts = [
            {
                name: "Photosynthesis",
                mastery: 75,
                attempts: 15,
                correct: 12,
                difficulty: "medium",
            },
            {
                name: "Cellular Respiration",
                mastery: 45,
                attempts: 12,
                correct: 5,
                difficulty: "easy",
            },
            {
                name: "DNA Replication",
                mastery: 85,
                attempts: 20,
                correct: 18,
                difficulty: "hard",
            },
            {
                name: "Mitosis",
                mastery: 30,
                attempts: 10,
                correct: 3,
                difficulty: "easy",
            },
            {
                name: "Meiosis",
                mastery: 60,
                attempts: 18,
                correct: 11,
                difficulty: "medium",
            },
            {
                name: "Cell Membrane Transport",
                mastery: 20,
                attempts: 8,
                correct: 2,
                difficulty: "easy",
            },
            {
                name: "Protein Synthesis",
                mastery: 55,
                attempts: 14,
                correct: 8,
                difficulty: "medium",
            },
            {
                name: "Enzyme Function",
                mastery: 90,
                attempts: 25,
                correct: 23,
                difficulty: "hard",
            },
            {
                name: "Genetics and Heredity",
                mastery: 70,
                attempts: 16,
                correct: 12,
                difficulty: "medium",
            },
            {
                name: "Evolution and Natural Selection",
                mastery: 40,
                attempts: 9,
                correct: 4,
                difficulty: "easy",
            },
        ];

        for (const concept of concepts) {
            const conceptId = uuid();
            const nextReview = new Date();
            // Set next review based on mastery (SRS)
            if (concept.mastery >= 80) {
                nextReview.setDate(nextReview.getDate() + 30);
            } else if (concept.mastery >= 60) {
                nextReview.setDate(nextReview.getDate() + 7);
            } else if (concept.mastery >= 40) {
                nextReview.setDate(nextReview.getDate() + 3);
            } else {
                nextReview.setDate(nextReview.getDate() + 1);
            }

            db.exec(`INSERT INTO user_concepts (
                    id, user_id, concept_name, mastery_level, 
                    total_attempts, correct_attempts, difficulty_level,
                    consecutive_correct, consecutive_wrong,
                    last_practiced_at, next_review_due, created_at
                ) VALUES (
                    ${esc(conceptId)}, ${esc(userId)}, ${esc(concept.name)}, ${
                concept.mastery
            },
                    ${concept.attempts}, ${concept.correct}, ${esc(
                concept.difficulty
            )},
                    ${concept.mastery > 70 ? 3 : 0}, ${
                concept.mastery < 40 ? 2 : 0
            },
                    datetime('now', '-2 days'), ${esc(
                        nextReview.toISOString()
                    )}, datetime('now', '-7 days')
                );`);
            console.log(`  ✓ ${concept.name} (Mastery: ${concept.mastery}%)`);
        }
        console.log(`✅ Created ${concepts.length} concepts\n`);

        // 2. Create practice history
        console.log("📊 Creating practice history...");
        const historyCount = 50;
        for (let i = 0; i < historyCount; i++) {
            const concept =
                concepts[Math.floor(Math.random() * concepts.length)];
            const wasCorrect = Math.random() < concept.mastery / 100;
            const difficulty = ["easy", "medium", "hard"][
                Math.floor(Math.random() * 3)
            ];
            const daysAgo = Math.floor(Math.random() * 14);
            const masteryBefore = Math.max(
                0,
                concept.mastery - Math.random() * 20
            );

            db.exec(`INSERT INTO concept_practice_history (
                    id, user_id, concept_name, session_id,
                    question_difficulty, was_correct,
                    mastery_before, mastery_after,
                    time_spent_seconds, created_at
                ) VALUES (
                    ${esc(uuid())}, ${esc(userId)}, ${esc(concept.name)}, NULL,
                    ${esc(difficulty)}, ${wasCorrect ? 1 : 0},
                    ${masteryBefore}, ${concept.mastery},
                    ${Math.floor(
                        20 + Math.random() * 60
                    )}, datetime('now', '-${daysAgo} days')
                );`);
        }
        console.log(`✅ Created ${historyCount} practice history records\n`);

        // 3. Create sample tests
        console.log("📝 Creating sample tests...");
        const testData = [
            {
                title: "Biology Basics",
                concepts: ["Photosynthesis", "Cellular Respiration"],
                questionCount: 10,
            },
            {
                title: "Cell Division",
                concepts: ["Mitosis", "Meiosis"],
                questionCount: 8,
            },
            {
                title: "Genetics Fundamentals",
                concepts: ["DNA Replication", "Genetics and Heredity"],
                questionCount: 12,
            },
        ];

        const testCodes = [];
        for (const test of testData) {
            const testId = uuid();
            const code =
                "T" + Math.random().toString(36).slice(2, 8).toUpperCase();
            testCodes.push(code);

            // Generate sample questions
            const questions = [];
            for (let i = 0; i < test.questionCount; i++) {
                const concept = test.concepts[i % test.concepts.length];
                questions.push({
                    id: uuid(),
                    type: "mcq",
                    question: `Question ${i + 1} about ${concept}?`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    answer: "Option A",
                    explanation: `This tests understanding of ${concept}`,
                    conceptTags: [concept],
                    difficulty: ["easy", "medium", "hard"][i % 3],
                });
            }

            const questionsJson = JSON.stringify(questions).replace(/'/g, "''");
            const paramsJson = JSON.stringify({
                questionCount: test.questionCount,
            }).replace(/'/g, "''");
            const conceptsJson = JSON.stringify(test.concepts).replace(
                /'/g,
                "''"
            );

            db.exec(`INSERT INTO tests (
                    id, code, title, source_filename, source_text,
                    model, params_json, questions_json,
                    expires_at, time_limit_seconds, created_by,
                    created_at, adaptive_mode, concepts_json
                ) VALUES (
                    ${esc(testId)}, ${esc(code)}, ${esc(test.title)}, NULL,
                    ${esc(`Sample test covering: ${test.concepts.join(", ")}`)},
                    'gpt-4', '${paramsJson}', '${questionsJson}',
                    datetime('now', '+30 days'), ${
                        test.questionCount * 90
                    }, ${esc(userId)},
                    datetime('now'), 1, '${conceptsJson}'
                );`);
            console.log(`  ✓ ${test.title} (Code: ${code})`);
        }
        console.log(
            `✅ Created ${
                testData.length
            } sample tests (Codes: ${testCodes.join(", ")})\n`
        );

        // 4. Create practice sessions
        console.log("🎯 Creating practice sessions...");
        const sessionTypes = ["quick", "focused", "mastery", "weak", "quick"];
        for (let i = 0; i < 5; i++) {
            const sessionId = uuid();
            const sessionType = sessionTypes[i];
            const daysAgo = i + 1;
            const score = 60 + Math.floor(Math.random() * 40);
            const questionsTotal = 10;
            const questionsCorrect = Math.floor((score / 100) * questionsTotal);
            const conceptsJson = JSON.stringify(
                concepts.slice(0, 3).map((c) => c.name)
            ).replace(/'/g, "''");

            db.exec(`INSERT INTO practice_sessions (
                    id, user_id, session_type, concepts_json,
                    target_difficulty, questions_total, questions_correct,
                    score_percentage, test_id, started_at, completed_at,
                    duration_seconds
                ) VALUES (
                    ${esc(sessionId)}, ${esc(userId)}, ${esc(
                sessionType
            )}, '${conceptsJson}',
                    'adaptive', ${questionsTotal}, ${questionsCorrect}, ${score}, NULL,
                    datetime('now', '-${daysAgo} days'), datetime('now', '-${daysAgo} days', '+15 minutes'),
                    ${600 + Math.floor(Math.random() * 300)}
                );`);
        }
        console.log(`✅ Created 5 practice sessions\n`);

        // 5. Create achievements
        console.log("🏆 Creating achievements...");
        const achievements = [
            { type: "streak_7", progress: 5, total: 7, earned: false },
            { type: "streak_30", progress: 5, total: 30, earned: false },
            { type: "concepts_10", progress: 10, total: 10, earned: true },
            { type: "concepts_50", progress: 10, total: 50, earned: false },
            { type: "concepts_100", progress: 10, total: 100, earned: false },
            { type: "perfect_10", progress: 3, total: 10, earned: false },
            { type: "sessions_50", progress: 5, total: 50, earned: false },
        ];

        for (const achievement of achievements) {
            const name = achievement.type
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
            const earnedAt = achievement.earned
                ? esc(new Date().toISOString())
                : "NULL";

            db.exec(`INSERT INTO user_achievements (
                    id, user_id, achievement_type, achievement_name,
                    description, progress, progress_total, earned_at, created_at
                ) VALUES (
                    ${esc(uuid())}, ${esc(userId)}, ${esc(
                achievement.type
            )}, ${esc(name)},
                    ${esc(`Achievement for ${achievement.type}`)},
                    ${achievement.progress}, ${
                achievement.total
            }, ${earnedAt}, datetime('now')
                );`);
        }
        console.log(`✅ Created ${achievements.length} achievements\n`);

        // 6. Create concept relationships
        console.log("🔗 Creating concept relationships...");
        const relationships = [
            {
                concept: "Meiosis",
                prerequisite: "Mitosis",
                type: "prerequisite",
            },
            {
                concept: "Protein Synthesis",
                prerequisite: "DNA Replication",
                type: "prerequisite",
            },
            {
                concept: "Evolution and Natural Selection",
                prerequisite: "Genetics and Heredity",
                type: "prerequisite",
            },
            {
                concept: "Cellular Respiration",
                prerequisite: "Cell Membrane Transport",
                type: "related",
            },
        ];

        for (const rel of relationships) {
            db.exec(`INSERT INTO concept_relationships (
                    id, concept_name, prerequisite_name,
                    relationship_type, strength, created_at
                ) VALUES (
                    ${esc(uuid())}, ${esc(rel.concept)}, ${esc(
                rel.prerequisite
            )},
                    ${esc(rel.type)}, 1.0, datetime('now')
                );`);
        }
        console.log(
            `✅ Created ${relationships.length} concept relationships\n`
        );

        console.log("✨ Database seeding completed successfully!\n");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📋 USER ACCOUNT:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Email: user1@example.com");
        console.log("ID:    da447d2d-bfed-4e3a-a493-4f55762b91f5");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log("📊 SEEDED DATA SUMMARY:");
        console.log(`  • ${concepts.length} Concepts (20% - 90% mastery)`);
        console.log(`  • ${historyCount} Practice History Records`);
        console.log(
            `  • ${testData.length} Sample Tests (Codes: ${testCodes.join(
                ", "
            )})`
        );
        console.log(`  • 5 Practice Sessions`);
        console.log(`  • ${achievements.length} Achievements (1 earned)`);
        console.log(`  • ${relationships.length} Concept Relationships\n`);
        console.log("🎯 You can now:");
        console.log("  1. Login with user1@example.com");
        console.log("  2. View dashboard: GET /api/v1/learning/dashboard");
        console.log("  3. See concepts: GET /api/v1/learning/concepts");
        console.log(
            "  4. Create sessions: POST /api/v1/learning/sessions/create"
        );
        console.log(
            "  5. Get recommendations: GET /api/v1/learning/recommendations"
        );
        console.log(
            "  6. Check achievements: GET /api/v1/learning/achievements\n"
        );

        // IMPORTANT: Persist the database to disk
        console.log("💾 Saving database to disk...");
        await saveDb();
        console.log("✅ Database saved successfully!");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        throw error;
    }
}

// Run seeding
seedUserData()
    .then(() => {
        console.log("✅ Seeding script completed");
        // Force exit to avoid waiting for the periodic save interval
        setTimeout(() => process.exit(0), 100);
    })
    .catch((error) => {
        console.error("❌ Seeding script failed:", error);
        process.exit(1);
    });
