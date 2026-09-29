"use strict";

require("dotenv").config();

const { Pool } = require("pg");

const db = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false }
});

const RATINGS = {
    course_satisfaction: "Course Satisfaction",
    syllabus_pace: "Syllabus Pace",
    concept_clarity: "Concept Clarity",
    practical_work: "Practical Work",
    study_material: "Study Material",
    exam_difficulty: "Exam Difficulty",
    faculty_support: "Faculty Support",
    improvement: "Improvement"
};

function parseResponses(responses) {
    if (!responses) return {};

    if (typeof responses === "string") {
        try {
            return JSON.parse(responses);
        } catch {
            return {};
        }
    }

    return responses;
}

async function checkFeedback() {
    try {
        console.log("\n========================================");
        console.log("       STUDENT FEEDBACK CHECK");
        console.log("========================================\n");

        await db.query("SELECT 1");
        console.log("✅ Database connected\n");

        // Get the single active feedback cycle
        const { rows: cycles } = await db.query(`
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            WHERE status = 'active'
            ORDER BY id DESC
        `);

        if (cycles.length === 0) {
            console.log("⚠️ No active feedback cycle.");
            return;
        }

        if (cycles.length > 1) {
            console.log("❌ Multiple active feedback cycles found.");
            console.table(cycles);
            return;
        }

        const cycle = cycles[0];

        console.log("📅 ACTIVE CYCLE");
        console.table([cycle]);

        // Get anonymous feedback
        const { rows: feedback } = await db.query(
            `
            SELECT
                fb.id,
                fb.faculty_id,
                f.name AS faculty_name,
                fb.department,
                fb.subject,
                fb.form_type,
                fb.responses
            FROM feedback fb
            LEFT JOIN faculty f
                ON f.faculty_id = fb.faculty_id
            WHERE fb.cycle_id = $1
            ORDER BY f.name, fb.subject, fb.id
            `,
            [cycle.id]
        );

        console.log("\n========================================");
        console.log("       ANONYMOUS FEEDBACK");
        console.log("========================================\n");

        if (!feedback.length) {
            console.log("⚠️ No feedback submitted yet.");
        } else {
            feedback.forEach((item, index) => {
                const responses = parseResponses(item.responses);

                console.log(`\n---------- FEEDBACK #${index + 1} ----------`);
                console.log(`Faculty    : ${item.faculty_name || "Unknown"}`);
                console.log(`Faculty ID : ${item.faculty_id || "Unknown"}`);
                console.log(`Department : ${item.department || "Unknown"}`);
                console.log(`Subject    : ${item.subject || "Unknown"}`);
                console.log(`Form Type  : ${item.form_type || "Unknown"}`);

                console.log("\nRatings:");

                for (const [key, label] of Object.entries(RATINGS)) {
                    console.log(
                        `  ${label.padEnd(22)}: ${responses[key] ?? "—"}`
                    );
                }

                const comment =
                    responses.comments ??
                    responses.comment ??
                    "";

                console.log(
                    `\nComment    : ${String(comment).trim() || "No comment"}`
                );
            });
        }

        // Feedback count by faculty and subject
        const { rows: summary } = await db.query(
            `
            SELECT
                f.name AS faculty_name,
                fb.subject,
                COUNT(*) AS feedback_count
            FROM feedback fb
            LEFT JOIN faculty f
                ON f.faculty_id = fb.faculty_id
            WHERE fb.cycle_id = $1
            GROUP BY f.name, fb.subject
            ORDER BY f.name, fb.subject
            `,
            [cycle.id]
        );

        console.log("\n========================================");
        console.log("       FEEDBACK SUMMARY");
        console.log("========================================\n");

        console.log(`📝 Total feedback records: ${feedback.length}`);

        if (summary.length) {
            console.table(summary);
        }

        // Student participation
        const { rows: submitted } = await db.query(
            `
            SELECT COUNT(DISTINCT student_id) AS count
            FROM feedback_submissions
            WHERE cycle_id = $1
            `,
            [cycle.id]
        );

        const { rows: total } = await db.query(`
            SELECT COUNT(*) AS count
            FROM students
        `);

        const submittedStudents = Number(submitted[0]?.count || 0);
        const totalStudents = Number(total[0]?.count || 0);
        const pendingStudents = Math.max(
            totalStudents - submittedStudents,
            0
        );

        const participation = totalStudents
            ? ((submittedStudents / totalStudents) * 100).toFixed(1)
            : "0.0";

        console.log("\n========================================");
        console.log("       PARTICIPATION");
        console.log("========================================");

        console.log(`👥 Total students     : ${totalStudents}`);
        console.log(`✅ Students submitted : ${submittedStudents}`);
        console.log(`⏳ Students pending   : ${pendingStudents}`);
        console.log(`📊 Participation      : ${participation}%`);

        console.log("\n========================================");
        console.log("       CHECK COMPLETE");
        console.log("========================================\n");

    } catch (error) {
        console.error("\n❌ Feedback check failed:");
        console.error(error.message);
    } finally {
        await db.end();
    }
}

checkFeedback();