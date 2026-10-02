const fs = require('fs');

let f = fs.readFileSync('public/css/faculty-directory.css', 'utf8');
f = f.replace(/:root\s*\{[\s\S]*?--danger:\s*#ef4444;\s*\}/, `:root {
    --background: #f8fafc;
    --header-bg: #ffffff;
    --card-bg: #ffffff;
    --card-bg-hover: #f1f5f9;
    --input-bg: #f8fafc;
    --border: #e2e8f0;
    --border-light: #cbd5e1;
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-light: #3b82f6;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --text-dim: #94a3b8;
    --danger: #ef4444;
}
body.dark {
    --background: #080f1d;
    --header-bg: #101a2c;
    --card-bg: #111d31;
    --card-bg-hover: #14233b;
    --input-bg: #0f1a2d;
    --border: #263754;
    --border-light: #334764;
    --primary: #3b82f6;
    --primary-dark: #2563eb;
    --primary-light: #60a5fa;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --text-dim: #475569;
    --danger: #ef4444;
}`);
fs.writeFileSync('public/css/faculty-directory.css', f);
