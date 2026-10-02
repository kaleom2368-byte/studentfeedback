require('dotenv').config();
const db = require('./db');

async function test() {
    // Check unique constraints on feedback_submissions
    const constraintResult = await db.query(`
        SELECT conname, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'feedback_submissions'::regclass
    `);
    console.log('Constraints on feedback_submissions:');
    console.log(JSON.stringify(constraintResult.rows, null, 2));

    // Check unique constraints on feedback
    const constraintResult2 = await db.query(`
        SELECT conname, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'feedback'::regclass
    `);
    console.log('\nConstraints on feedback:');
    console.log(JSON.stringify(constraintResult2.rows, null, 2));

    // Check if student IT-2243 has any submissions for cycle 7
    const subResult = await db.query(
        'SELECT * FROM feedback_submissions WHERE student_id = $1 AND cycle_id = $2',
        ['IT-2243', 7]
    );
    console.log('\nIT-2243 submissions for cycle 7:', subResult.rows);

    // Check what the student sees when trying to submit
    const activeCycle = await db.query("SELECT * FROM feedback_cycles WHERE status = 'active'");
    console.log('\nActive cycle:', activeCycle.rows);

    process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
