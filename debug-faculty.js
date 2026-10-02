const fs = require('fs');
let code = fs.readFileSync('routes/faculty.js', 'utf8');
code = code.replace(/return res\.status\(500\)\.json\(\{\s*success:\s*false,\s*message:\s*"Failed to load feedback data"\s*\}\);/,
`return res.status(500).json({ success: false, message: "Failed to load feedback data", error: error.message, stack: error.stack });`);
fs.writeFileSync('routes/faculty.js', code);
