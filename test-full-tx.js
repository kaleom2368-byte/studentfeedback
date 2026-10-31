require('dotenv').config();
const db = require('./db');

async function testSubmit() {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        
        const feedbackSql = `
            INSERT INTO feedback (faculty_id, department, subject, form_type, responses, cycle_id)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6)
        `;
        await client.query(feedbackSql, [
            'IT-TCH-001', 'Information Technology', 'DSA', 'theory', '{"course_satisfaction":"Satisfied"}', 1
        ]);
        
        const trackingSql = `
            INSERT INTO feedback_submissions (student_id, faculty_id, subject, cycle_id)
            VALUES ($1, $2, $3, $4)
        `;
        await client.query(trackingSql, [
            'IT-2201', 'IT-TCH-001', 'DSA', 1
        ]);
        
        await client.query("COMMIT");
        console.log("✅ Full transaction successful!");
    } catch(e) {
        await client.query("ROLLBACK");
        console.error("❌ Transaction Failed:", e.message);
    } finally {
        client.release();
        process.exit(0);
    }
}
testSubmit();
