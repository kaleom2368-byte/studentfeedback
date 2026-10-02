const fs = require('fs');
let code = fs.readFileSync('routes/faculty.js', 'utf8');

code = code.replace(/res\.status\(500\)\.json\(\{\s*success:\s*false,\s*message:\s*"Unable to load faculty feedback"\s*\}\);/,
`res.status(500).json({ success: false, message: "Unable to load faculty feedback", error: error.message, stack: error.stack });`);

fs.writeFileSync('routes/faculty.js', code);
