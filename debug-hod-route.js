const fs = require('fs');
let code = fs.readFileSync('routes/hod.js', 'utf8');

code = code.replace(/return res\.status\(500\)\.json\(\{\s*success:\s*false,\s*message:\s*"Unable to load dashboard data"\s*\}\);/,
`return res.status(500).json({ success: false, message: "Unable to load dashboard data", error: err.message, stack: err.stack });`);

fs.writeFileSync('routes/hod.js', code);
