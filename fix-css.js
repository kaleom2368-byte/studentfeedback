const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'public', 'css');
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

for (const file of files) {
    let content = fs.readFileSync(path.join(cssDir, file), 'utf8');
    
    // Replace random colorful gradients with a standard blue gradient
    content = content.replace(/linear-gradient\([^;]*(4facfe|f093fb|7c3aed|667eea|0f766e|43e97b)[^;]*\)/gi, 'linear-gradient(135deg, #1e3a8a, #0f172a)');
    
    // Replace linear-gradient backgrounds for login pages (they are too colorful)
    if (file.includes('login') || file.includes('main')) {
        content = content.replace(/linear-gradient\([^;]+\)/gi, 'linear-gradient(135deg, #1e3a8a, #0f172a)');
    }
    
    fs.writeFileSync(path.join(cssDir, file), content);
}

// Specifically update darkmode.css to enforce dark mode on ALL cards
let dm = fs.readFileSync(path.join(cssDir, 'darkmode.css'), 'utf8');
dm += `\n
/* FORCED DARK MODE FOR ALL CARDS AND SECTIONS */
body.dark .dashboard-card,
body.dark .portal-card,
body.dark .recognition-grid > div,
body.dark .performance-card,
body.dark .report-card,
body.dark .privacy-card,
body.dark .glass-card {
    background: #1e293b !important;
    color: #f8fafc !important;
    border: 1px solid #334155 !important;
}

body.dark header {
    background: #0f172a !important;
}

body.dark section {
    background: transparent;
}
`;
fs.writeFileSync(path.join(cssDir, 'darkmode.css'), dm);

console.log('CSS fixed');
