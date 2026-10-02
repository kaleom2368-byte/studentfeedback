const fs = require('fs');

let html = fs.readFileSync('public/dashboard/faculty-directory.html', 'utf8');
if (!html.includes('dark-mode-btn')) {
    html = html.replace(/<div class="header-content">/, 
        `<div class="header-content">\n            <button id="dark-mode-btn" type="button" class="theme-toggle">🌙 Dark Mode</button>`);
    fs.writeFileSync('public/dashboard/faculty-directory.html', html);
}

let css = fs.readFileSync('public/css/faculty-directory.css', 'utf8');
if (!css.includes('.theme-toggle')) {
    css += `\n\n.theme-toggle { position: absolute; right: 20px; top: 20px; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg); color: var(--text-main); cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 600; }
.theme-toggle:hover { background: var(--card-bg-hover); }`;
    fs.writeFileSync('public/css/faculty-directory.css', css);
}

let statusHtml = fs.readFileSync('public/feedback-status.html', 'utf8');
if (!statusHtml.includes('dark-mode-btn')) {
    statusHtml = statusHtml.replace(/<div class="header-content">/, 
        `<div class="header-content">\n            <button id="dark-mode-btn" type="button" class="theme-toggle">🌙 Dark Mode</button>`);
    fs.writeFileSync('public/feedback-status.html', statusHtml);
}

let statusCss = fs.readFileSync('public/css/feedback-status.css', 'utf8');
if (!statusCss.includes('.theme-toggle')) {
    statusCss += `\n\n.theme-toggle { position: absolute; right: 20px; top: 20px; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card-bg); color: var(--text-main); cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 600; }
.theme-toggle:hover { background: var(--bg-gradient); }`;
    fs.writeFileSync('public/css/feedback-status.css', statusCss);
}
