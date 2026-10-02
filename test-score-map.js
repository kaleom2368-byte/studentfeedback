require('dotenv').config();
const db = require('./db');

const PARAMETERS = ['course_satisfaction','syllabus_pace','concept_clarity','practical_work','study_material','exam_difficulty','faculty_support','improvement'];
const SCORE_MAPS = {
    course_satisfaction: { "Very Satisfied": 5, "Satisfied": 4, "Neutral": 3, "Dissatisfied": 2, "Very Dissatisfied": 1 },
    syllabus_pace: { "Very Appropriate": 5, "Appropriate": 4, "Neutral": 3, "Too Fast": 2, "Too Slow": 1 },
    concept_clarity: { "Very Clear": 5, "Clear": 4, "Neutral": 3, "Not Clear": 2 },
    practical_work: { "Very Helpful": 5, "Helpful": 4, "Neutral": 3, "Not Helpful": 2 },
    study_material: { "Very Helpful": 5, "Helpful": 4, "Neutral": 3, "Not Helpful": 2 },
    exam_difficulty: { "Very Appropriate": 5, "Appropriate": 4, "Neutral": 3, "Difficult": 2, "Very Difficult": 1 },
    faculty_support: { "Excellent": 5, "Good": 4, "Average": 3, "Needs Improvement": 2 }
};

async function test() {
    const feedbackResult = await db.query('SELECT responses FROM feedback WHERE faculty_id=$1 AND cycle_id=$2', ['IT-TCH-001', 5]);
    for (const row of feedbackResult.rows) {
        let responses = row.responses;
        if (typeof responses === 'string') try { responses = JSON.parse(responses); } catch { responses = {}; }
        console.log('responses:', responses);
        for (const key of PARAMETERS) {
            if (key === 'improvement') continue;
            const raw = responses[key];
            if (!raw) continue;
            const score = SCORE_MAPS[key]?.[String(raw).trim()];
            console.log(key, ':', raw, '->', score);
        }
    }
    process.exit(0);
}
test();
