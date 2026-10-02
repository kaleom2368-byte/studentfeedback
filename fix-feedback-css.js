const fs = require('fs');
let f = fs.readFileSync('public/css/feedback.css', 'utf8');
f = f.replace(/rgba\(124,\s*58,\s*237,\s*0\.[0-9]+\)/g, "rgba(29, 78, 216, 0.15)");
f = f.replace(/html\.dark/g, "body.dark");
fs.writeFileSync('public/css/feedback.css', f);
