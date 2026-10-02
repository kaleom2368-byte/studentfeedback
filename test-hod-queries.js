require('dotenv').config();
const db = require('./db');

function getFeedbackAverage(responses) {
    if (!responses || typeof responses !== 'object') return 0;
    let sum = 0, count = 0;
    for (const val of Object.values(responses)) {
        const num = Number(val);
        if (Number.isFinite(num) && num >= 1 && num <= 5) {
            sum += num;
            count++;
        }
    }
    return count > 0 ? (sum / count) : 0;
}

async function test() {
    try {
        const cycleId = 1;
        const department = 'Information Technology';
        
        const statsResult = await db.query(`
            SELECT responses
            FROM feedback
            WHERE cycle_id = $1
              AND LOWER(TRIM(department)) = LOWER(TRIM($2))
        `, [cycleId, department]);

        console.log('statsResult:', statsResult.rows);

        const totalFeedback = statsResult.rows.length;
        let deptTotalScore = 0;
        let deptCount = 0;
        for (const row of statsResult.rows) {
            let responses = row.responses;
            if (typeof responses === 'string') {
               responses = JSON.parse(responses);
            }
            const avg = getFeedbackAverage(responses);
            if (avg > 0) { deptTotalScore += avg; deptCount++; }
        }
        const averageRating = deptCount > 0 ? (deptTotalScore / deptCount) : 0;
        console.log('averageRating:', averageRating);

        const perfResult = await db.query(`
            SELECT
                f.faculty_id,
                f.name,
                f.email,
                f.department,
                fb.responses
            FROM faculty f
            LEFT JOIN feedback fb
                ON fb.faculty_id = f.faculty_id
               AND fb.cycle_id   = $1
            WHERE LOWER(TRIM(f.department)) = LOWER(TRIM($2))
        `, [cycleId, department]);
        
        console.log('perfResult:', perfResult.rows.length);

    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}
test();
