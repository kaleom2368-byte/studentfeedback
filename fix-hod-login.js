const fs = require('fs');
let f = fs.readFileSync('public/css/hod-login.css', 'utf8');

f = f.replace(/body\s*\{\s*background:\s*linear-gradient\(135deg,\s*#1e3a8a,\s*#0f172a\);\s*\}/, 
`body { background: linear-gradient(135deg, #f8fafc, #eff6ff); }
body.dark { background: linear-gradient(135deg, #1e3a8a, #0f172a); }`);

fs.writeFileSync('public/css/hod-login.css', f);
