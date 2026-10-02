const db = require('./db');

async function testInsert() {
    try {
        const res = await db.query(`
            INSERT INTO feedback (faculty_id, department, subject, form_type, responses, cycle_id)
            VALUES ('IT-TCH-001', 'Information Technology', 'DSA', 'theory', '{"course_satisfaction":5}'::jsonb, 1)
            RETURNING id
        `);
        console.log('Inserted ID:', res.rows[0].id);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}
testInsert();
