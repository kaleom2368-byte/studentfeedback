const fs = require('fs');

let css = fs.readFileSync('public/css/faculty-directory.css', 'utf8');

const lightRoot = `:root {
    --background: #eff6ff;
    --header-bg: #ffffff;
    --card-bg: #ffffff;
    --card-bg-hover: #f8fafc;
    --input-bg: #f1f5f9;
    --border: #e2e8f0;
    --border-light: #cbd5e1;
    --primary: #3b82f6;
    --primary-dark: #2563eb;
    --primary-light: #93c5fd;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --success: #10b981;
    --success-bg: #d1fae5;
    --success-border: #a7f3d0;
    --warning: #f59e0b;
    --warning-bg: #fef3c7;
    --warning-border: #fde68a;
    --danger: #ef4444;
    --danger-bg: #fee2e2;
    --danger-border: #fecaca;
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
    --text-main: #e2e8f0;
    --text-muted: #94a3b8;
    --success: #34d399;
    --success-bg: rgba(16, 185, 129, 0.12);
    --success-border: rgba(16, 185, 129, 0.28);
    --warning: #fbbf24;
    --warning-bg: rgba(245, 158, 11, 0.12);
    --warning-border: rgba(245, 158, 11, 0.28);
    --danger: #f87171;
    --danger-bg: rgba(239, 68, 68, 0.12);
    --danger-border: rgba(248, 113, 113, 0.28);
}`;

css = css.replace(/:root\s*\{[\s\S]*?--danger-border:[^;]+;\s*\}/, lightRoot);

fs.writeFileSync('public/css/faculty-directory.css', css);
