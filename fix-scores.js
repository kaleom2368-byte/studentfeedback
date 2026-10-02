const fs = require('fs');

const globalScoreMap = `
const VALUE_TO_SCORE = {
    "Very Satisfied": 5, "Very Appropriate": 5, "Very Clear": 5, "Very Helpful": 5, "Excellent": 5, "Just Right": 5,
    "Satisfied": 4, "Appropriate": 4, "Mostly Clear": 4, "Clear": 4, "Helpful": 4, "Good": 4,
    "Neutral": 3, "Somewhat Clear": 3, "Average": 3,
    "Dissatisfied": 2, "Too Fast": 2, "Not Clear": 2, "Not Helpful": 2, "Difficult": 2, "Needs Improvement": 2, "Poor": 2,
    "Very Dissatisfied": 1, "Too Slow": 1, "Very Difficult": 1, "Very Poor": 1
};
`;

let hodCode = fs.readFileSync('routes/hod.js', 'utf8');
hodCode = hodCode.replace(/function getFeedbackAverage[\s\S]*?return count > 0 \? \(sum \/ count\) : 0;\s*\}/, 
globalScoreMap + `
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
    return count > 0 ? (sum / count) : 0;
}`);

fs.writeFileSync('routes/hod.js', hodCode);

let facultyCode = fs.readFileSync('routes/faculty.js', 'utf8');
if (!facultyCode.includes('VALUE_TO_SCORE')) {
    facultyCode = facultyCode.replace(/const SCORE_MAPS = \{[\s\S]*?score = numeric;\s*\}\s*\}/, 
    globalScoreMap + `
            let score = VALUE_TO_SCORE[String(raw).trim()];

            if (score === undefined) {
                const numeric = Number(raw);

                if (
                    Number.isFinite(numeric) &&
                    numeric >= 1 &&
                    numeric <= 5
                ) {
                    score = numeric;
                }
            }`);
    fs.writeFileSync('routes/faculty.js', facultyCode);
}
