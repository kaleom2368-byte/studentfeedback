const fs = require('fs');
let code = fs.readFileSync('routes/faculty.js', 'utf8');

// 1. Fix faculty_divisions query to use department instead
code = code.replace(/WHERE EXISTS \(\s*SELECT 1\s*FROM faculty_divisions fd\s*WHERE fd\.faculty_id = \$1\s*AND LOWER\(TRIM\(fd\.division\)\) =\s*LOWER\(TRIM\(s\.division\)\)\s*\)/,
"WHERE LOWER(TRIM(s.department)) = LOWER(TRIM($3))");

// Also need to pass the department argument $3 in the db.query call
code = code.replace(/\[id, activeCycle\.id\]/g, "[id, activeCycle.id, req.session.faculty.department]");

// 2. Add VALUE_TO_SCORE
const newScoreMaps = `
const VALUE_TO_SCORE = {
    "Very Satisfied": 5, "Very Appropriate": 5, "Very Clear": 5, "Very Helpful": 5, "Excellent": 5, "Just Right": 5,
    "Satisfied": 4, "Appropriate": 4, "Mostly Clear": 4, "Clear": 4, "Helpful": 4, "Good": 4,
    "Neutral": 3, "Somewhat Clear": 3, "Average": 3,
    "Dissatisfied": 2, "Too Fast": 2, "Not Clear": 2, "Not Helpful": 2, "Difficult": 2, "Needs Improvement": 2, "Poor": 2,
    "Very Dissatisfied": 1, "Too Slow": 1, "Very Difficult": 1, "Very Poor": 1
};`;

code = code.replace(/const SCORE_MAPS = \{[\s\S]*?"Never Available": 1\s*\n\s*\};/, newScoreMaps);

// 3. Fix score logic
code = code.replace(/let score = SCORE_MAPS\[key\]\?\.\[String\(raw\)\.trim\(\)\];/, "let score = VALUE_TO_SCORE[String(raw).trim()];");

fs.writeFileSync('routes/faculty.js', code);
