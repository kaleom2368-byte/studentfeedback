const fs = require('fs');

// 1. Fix routes/hod.js
let hodJs = fs.readFileSync('routes/hod.js', 'utf8');
hodJs = hodJs.replace(/faculty_id\s+INT,/g, 'faculty_id  VARCHAR(20),');
hodJs = hodJs.replace(/const teaching = Number\(resData\.course_satisfaction \|\| resData\.concept_clarity \|\| 0\);/g, 'const teaching = getFeedbackAverage({a: resData.course_satisfaction}) || getFeedbackAverage({a: resData.concept_clarity}) || 0;');
hodJs = hodJs.replace(/const comm = Number\(resData\.student_interaction \|\| resData\.doubt_clearing \|\| 0\);/g, 'const comm = getFeedbackAverage({a: resData.student_interaction}) || getFeedbackAverage({a: resData.doubt_clearing}) || 0;');
hodJs = hodJs.replace(/const behav = Number\(resData\.professionalism \|\| resData\.class_control \|\| 0\);/g, 'const behav = getFeedbackAverage({a: resData.professionalism}) || getFeedbackAverage({a: resData.class_control}) || 0;');
hodJs = hodJs.replace(/error: err\.message, stack: err\.stack/g, 'error: err.message');
fs.writeFileSync('routes/hod.js', hodJs);

// 2. Fix routes/faculty-directory.js
let fdJs = fs.readFileSync('routes/faculty-directory.js', 'utf8');
fdJs = fdJs.replace(/if \(!req\.session\.student\)/g, 'if (!req.session || !req.session.student)');
fdJs = fdJs.replace(/SELECT faculty_id, name, email, department/g, 'SELECT faculty_id, name, email, department, subject');
fs.writeFileSync('routes/faculty-directory.js', fdJs);

// 3. Fix routes/admin.js (logout redirect)
let adminJs = fs.readFileSync('routes/admin.js', 'utf8');
adminJs = adminJs.replace(/router\.get\("\/logout", requireAdmin, \(req, res\) => \{/g, 'router.get("/logout", (req, res) => {');
fs.writeFileSync('routes/admin.js', adminJs);

// 4. Fix seed-reset.sql (add unique constraint)
let seedSql = fs.readFileSync('seed-reset.sql', 'utf8');
if (!seedSql.includes('UNIQUE(student_id, cycle_id)')) {
    seedSql = seedSql.replace(/cycle_id\s+INT/g, 'cycle_id INT,\n    UNIQUE(student_id, cycle_id)');
    fs.writeFileSync('seed-reset.sql', seedSql);
}

console.log('Backend bugs fixed successfully.');
