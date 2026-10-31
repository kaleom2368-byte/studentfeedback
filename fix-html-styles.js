const fs = require('fs');
const path = require('path');

const filesToFix = [
    'public/change-password/student.html',
    'public/change-password/faculty.html',
    'public/change-password/hod.html',
    'public/change-password/admin.html',
    'public/dashboard/hod-reports.html',
    'public/dashboard/admin-dashboard.html'
];

const colorMap = {
    '#fff': 'var(--card-bg)',
    '#ffffff': 'var(--card-bg)',
    '#f8fafc': 'var(--page-bg)',
    '#f9fafb': 'var(--page-bg)',
    '#f3f4f6': 'var(--page-bg)',
    '#f1f5f9': 'var(--border-light)',
    '#f0fdf4': 'var(--success-bg)',
    '#fef2f2': 'var(--danger-bg)',
    '#fffbeb': 'var(--warning-bg)',
    '#dbeafe': 'var(--primary-bg)',
    '#eff6ff': 'var(--primary-bg-subtle)',
    '#fafafa': 'var(--card-bg)',
    '#fef2f2': 'var(--danger-bg)',
    '#fca5a5': 'var(--danger-border)',
    '#991b1b': 'var(--danger)',
    '#fff3cd': 'var(--warning-bg)',
    '#ffc107': 'var(--warning-border)',

    '#000': 'var(--text)',
    '#333': 'var(--text)',
    '#1f2937': 'var(--text)',
    '#1e293b': 'var(--text)',
    '#0f172a': 'var(--text)',
    '#111827': 'var(--text)',
    '#374151': 'var(--text)',
    '#334155': 'var(--text-secondary)',
    '#475569': 'var(--text-secondary)',
    '#6b7280': 'var(--text-secondary)',
    '#64748b': 'var(--text-muted)',
    '#9ca3af': 'var(--text-muted)',
    '#94a3b8': 'var(--text-light)',
    '#cbd5e1': 'var(--input-border)',
    '#d1d5db': 'var(--input-border)',
    '#e2e8f0': 'var(--border)',
    '#e5e7eb': 'var(--border)',

    '#667eea': 'var(--primary)',
    '#764ba2': 'var(--primary-dark)',
    '#f093fb': 'var(--primary)',
    '#f5576c': 'var(--primary-dark)',
    '#4facfe': 'var(--primary)',
    '#00f2fe': 'var(--primary-accent)',
    '#43e97b': 'var(--primary)',
    '#38f9d7': 'var(--primary-accent)',
    '#2563eb': 'var(--primary)',
    '#1d4ed8': 'var(--primary-dark)',
    '#4f46e5': 'var(--primary-dark)',
};

// Add 3-letter versions
Object.keys(colorMap).forEach(k => {
    if (k.length === 7 && k[1] === k[2] && k[3] === k[4] && k[5] === k[6]) {
        const shortK = '#' + k[1] + k[3] + k[5];
        if (!colorMap[shortK]) colorMap[shortK] = colorMap[k];
    }
});

const keysSorted = Object.keys(colorMap).sort((a, b) => b.length - a.length);
const pattern = new RegExp(`(${keysSorted.join('|')})(?![0-9a-fA-F])`, 'gi');

for (const file of filesToFix) {
    const filepath = path.join(__dirname, file);
    if (!fs.existsSync(filepath)) continue;
    
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Replace hex colors inside <style> tags
    content = content.replace(/<style>([\s\S]*?)<\/style>/gi, (match, p1) => {
        let newStyle = p1.replace(pattern, (m) => colorMap[m.toLowerCase()]);
        
        // Catch any remaining random hex colors
        newStyle = newStyle.replace(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/gi, (m) => {
            const c = m.toLowerCase();
            if (c.startsWith('#0') || c.startsWith('#1') || c.startsWith('#2') || c.startsWith('#3')) return 'var(--primary-dark)';
            if (c.startsWith('#f') || c.startsWith('#e')) return 'var(--page-bg)';
            return 'var(--primary)';
        });
        return `<style>${newStyle}</style>`;
    });

    // Add global.css to <head> if not present
    if (!content.includes('global.css')) {
        content = content.replace(/<\/head>/i, '  <link rel="stylesheet" href="/css/global.css">\n</head>');
    }

    fs.writeFileSync(filepath, content);
}

console.log('HTML inline styles fixed.');
