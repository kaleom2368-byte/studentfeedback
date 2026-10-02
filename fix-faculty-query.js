const fs = require('fs');
let code = fs.readFileSync('routes/faculty.js', 'utf8');

code = code.replace(
    /FROM feedback\s+WHERE faculty_id = \$1\s+AND cycle_id = \$2\s+ORDER BY id DESC\s+`,\s+\[id, activeCycle\.id, req\.session\.faculty\.department\]/,
    "FROM feedback\n            WHERE faculty_id = $1\n              AND cycle_id = $2\n            ORDER BY id DESC\n            `,\n            [id, activeCycle.id]"
);

fs.writeFileSync('routes/faculty.js', code);
