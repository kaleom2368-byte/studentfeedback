"use strict";

const db = require("./db");

async function checkFeedback() {
    try {
        console.log("\n========================================");
        console.log("       LATEST FEEDBACK RECORDS");
        console.log("========================================\n");

        const { rows } = await db.query(`
            SELECT
                id,
                faculty_id,
                department,
                subject,
                form_type,
                responses,
                cycle_id
            FROM feedback
            ORDER BY id DESC
            LIMIT 5
        `);

        if (!rows.length) {
            console.log("⚠️ No feedback records found.");
            return;
        }

        console.table(
            rows.map(row => ({
                id: row.id,
                faculty_id: row.faculty_id,
                department: row.department,
                subject: row.subject,
                form_type: row.form_type,
                cycle_id: row.cycle_id,
                responses:
                    typeof row.responses === "string"
                        ? row.responses
                        : JSON.stringify(row.responses)
            }))
        );

        console.log(`\n✅ Showing ${rows.length} latest feedback records.`);

    } catch (error) {
        console.error("\n❌ Failed to read feedback:");
        console.error(error.message);
    } finally {
        await db.end();
    }
}

checkFeedback();