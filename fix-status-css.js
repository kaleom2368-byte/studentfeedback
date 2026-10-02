const fs = require('fs');
let css = fs.readFileSync('public/css/feedback-status.css', 'utf8');

if (!css.includes(':root')) {
    css = `
:root {
    --bg-gradient: linear-gradient(135deg, #eff6ff, #dbeafe);
    --text-main: #1e293b;
    --text-muted: #64748b;
    --card-bg: #ffffff;
    --border: #e2e8f0;
    --primary: #2563eb;
    --success: #10b981;
    --danger: #ef4444;
}

body.dark {
    --bg-gradient: linear-gradient(135deg, #0f172a, #1e293b);
    --text-main: #f8fafc;
    --text-muted: #cbd5e1;
    --card-bg: #1e293b;
    --border: #334155;
    --primary: #60a5fa;
    --success: #34d399;
    --danger: #f87171;
}
` + css;

    css = css.replace(/background:\s*linear-gradient[^;]+;/, 'background: var(--bg-gradient);');
    css = css.replace(/color:\s*#333;/, 'color: var(--text-main);');
    css = css.replace(/background:\s*#fff;/, 'background: var(--card-bg);');
    css = css.replace(/background:\s*#ffffff;/, 'background: var(--card-bg);');
    css = css.replace(/color:\s*#555;/, 'color: var(--text-muted);');
    css = css.replace(/color:\s*#666;/, 'color: var(--text-muted);');
    css = css.replace(/border[^:]*:\s*1px solid #ddd;/, 'border: 1px solid var(--border);');
    
    fs.writeFileSync('public/css/feedback-status.css', css);
}
