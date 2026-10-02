const fs = require('fs');

const newScoreMaps = `const SCORE_MAPS = {
    course_satisfaction: { "Very Satisfied": 5, "Satisfied": 4, "Neutral": 3, "Dissatisfied": 2, "Very Dissatisfied": 1 },
    syllabus_pace: { "Very Appropriate": 5, "Appropriate": 4, "Neutral": 3, "Too Fast": 2, "Too Slow": 1 },
    concept_clarity: { "Very Clear": 5, "Clear": 4, "Neutral": 3, "Not Clear": 2 },
    practical_work: { "Very Helpful": 5, "Helpful": 4, "Neutral": 3, "Not Helpful": 2 },
    study_material: { "Very Helpful": 5, "Helpful": 4, "Neutral": 3, "Not Helpful": 2 },
    exam_difficulty: { "Very Appropriate": 5, "Appropriate": 4, "Neutral": 3, "Difficult": 2, "Very Difficult": 1 },
    faculty_support: { "Excellent": 5, "Good": 4, "Average": 3, "Needs Improvement": 2 }
};`;

let code = fs.readFileSync('routes/faculty.js', 'utf8');
code = code.replace(/const SCORE_MAPS = \{[\s\S]*?"Never Available": 1\s*\}\s*\};/, newScoreMaps);
fs.writeFileSync('routes/faculty.js', code);
