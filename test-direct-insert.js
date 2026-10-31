require('dotenv').config();
const db = require('./db');

async function testSubmit() {
    try {
        console.log("Testing direct insert...");
        const result = await db.query(`
            INSERT INTO feedback (
                faculty_id, department, subject, form_type, responses, cycle_id
            ) VALUES (
                'IT-TCH-001', 'Information Technology', 'DSA', 'theory', '{"course_satisfaction":"Satisfied"}'::jsonb, 1
            ) RETURNING *
        `);
        console.log("✅ Success! Inserted:", result.rows[0]);
    } catch(e) {
        console.error("❌ Insert Failed:", e.message);
    } finally {
        process.exit(0);
    }
}
testSubmit();
