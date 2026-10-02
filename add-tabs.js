const fs = require('fs');
let code = fs.readFileSync('public/js/hod-dashboard.js', 'utf8');

const tabsLogic = `
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
}
`;

code = code.replace(/document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{/, 
`document.addEventListener("DOMContentLoaded", () => {
    setupTabs();`);

code += tabsLogic;

fs.writeFileSync('public/js/hod-dashboard.js', code);
