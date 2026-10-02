const fs = require('fs');
let code = fs.readFileSync('routes/hod.js', 'utf8');

code = code.replace(/GROUP BY s\.student_id/, "GROUP BY s.student_id, s.name, s.email, s.year, s.division, s.department");

fs.writeFileSync('routes/hod.js', code);
