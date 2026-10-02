require('dotenv').config();
const db = require('./db');

const globalScoreMap = `
const VALUE_TO_SCORE = {
    "Very Satisfied": 5, "Very Appropriate": 5, "Very Clear": 5, "Very Helpful": 5, "Excellent": 5, "Just Right": 5,
    "Satisfied": 4, "Appropriate": 4, "Mostly Clear": 4, "Clear": 4, "Helpful": 4, "Good": 4,
    "Neutral": 3, "Somewhat Clear": 3, "Average": 3,
    "Dissatisfied": 2, "Too Fast": 2, "Not Clear": 2, "Not Helpful": 2, "Difficult": 2, "Needs Improvement": 2, "Poor": 2,
    "Very Dissatisfied": 1, "Too Slow": 1, "Very Difficult": 1, "Very Poor": 1
};
`;
eval(globalScoreMap);

function getFeedbackAverage(responses) {
    if (typeof responses === 'string') {
        try { responses = JSON.parse(responses); } catch (e) { responses = {}; }
    }
    if (!responses || typeof responses !== 'object') return 0;
    let sum = 0, count = 0;
    for (const val of Object.values(responses)) {
        if (typeof val === 'string' && VALUE_TO_SCORE[val]) {
            sum += VALUE_TO_SCORE[val];
            count++;
        } else {
            const num = Number(val);
            if (Number.isFinite(num) && num >= 1 && num <= 5) {
                sum += num;
                count++;
            }
        }
    }
    console.log('calculated avg:', sum, count);
    return count > 0 ? (sum / count) : 0;
}

async function test() {
    const cycleId = 5;
    const department = "Information Technology";
    const statsResult = await db.query(`
        SELECT responses
        FROM feedback
        WHERE cycle_id = $1
          AND LOWER(TRIM(department)) = LOWER(TRIM($2))
    `, [cycleId, department]);
    
    console.log('rows:', statsResult.rows);
    let deptTotalScore = 0, deptCount = 0;
    for (const row of statsResult.rows) {
        console.log('row responses:', typeof row.responses, row.responses);
        const avg = getFeedbackAverage(row.responses);
        console.log('avg returned:', avg);
        if (avg > 0) { deptTotalScore += avg; deptCount++; }
    }
    console.log('final average:', deptCount > 0 ? (deptTotalScore / deptCount) : 0);
    process.exit(0);
}
test();
