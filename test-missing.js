require('dotenv').config();
const db = require('./db');

async function test() {
    try {
        const cycleId = 1;
        const department = "Information Technology";
        
        const missingResult = await db.query(`
            SELECT
                s.student_id,
                s.name,
                s.email,
                s.year,
                s.division,
                s.department,
                CASE
                    WHEN COUNT(fs.id) > 0 THEN TRUE
                    ELSE FALSE
                END AS submitted
            FROM students s
            LEFT JOIN feedback_submissions fs
                ON fs.student_id = s.student_id
               AND fs.cycle_id   = $1
            WHERE LOWER(TRIM(s.department)) = LOWER(TRIM($2))
            GROUP BY s.student_id
        `, [cycleId, department]);
        
        console.log('Success, rows:', missingResult.rows.length);
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}
test();
