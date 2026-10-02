const fs = require('fs');
let f = fs.readFileSync('public/css/admin-dashboard.css', 'utf8');

if (!f.includes('body.dark {')) {
    f += `
body.dark {
    --admin-bg: #0f172a;
    --admin-surface: #1e293b;
    --admin-surface-2: #334155;
    
    --admin-text: #f8fafc;
    --admin-text-secondary: #94a3b8;
    
    --admin-border: #334155;
    
    --admin-primary: #3b82f6;
    --admin-primary-hover: #60a5fa;
    
    --admin-success: #22c55e;
    --admin-success-bg: rgba(22, 163, 74, 0.15);
    
    --admin-danger: #ef4444;
    --admin-danger-bg: rgba(239, 68, 68, 0.15);
    
    --admin-warning: #f59e0b;
    --admin-warning-bg: rgba(245, 158, 11, 0.15);
}

body.dark header {
    background: #1e293b !important;
    border-bottom: 1px solid var(--admin-border) !important;
}

body.dark nav {
    background: #1e293b !important;
    border-bottom: 1px solid var(--admin-border) !important;
}

body.dark .welcome-box,
body.dark .section-card,
body.dark .create-box,
body.dark .reset-card,
body.dark .current-cycle-card,
body.dark .create-cycle-card,
body.dark .cycle-history-card {
    background: var(--admin-surface) !important;
    border-color: var(--admin-border) !important;
    color: var(--admin-text) !important;
}

body.dark .stat-mini,
body.dark .tab-bar,
body.dark .cycle-history-header {
    background: var(--admin-surface-2) !important;
    border-color: var(--admin-border) !important;
}

body.dark .tab-btn {
    color: var(--admin-text-secondary) !important;
}

body.dark .tab-btn.active {
    color: var(--admin-primary) !important;
    background: var(--admin-surface) !important;
    border-bottom-color: var(--admin-primary) !important;
}

body.dark .form-field input,
body.dark .form-field select {
    background: var(--admin-surface-2) !important;
    color: var(--admin-text) !important;
    border-color: var(--admin-border) !important;
}

body.dark .admin-table th {
    background: var(--admin-surface-2) !important;
    color: var(--admin-text-secondary) !important;
    border-color: var(--admin-border) !important;
}

body.dark .admin-table td {
    border-color: var(--admin-border) !important;
    color: var(--admin-text) !important;
}

body.dark .admin-table tbody tr:hover {
    background: var(--admin-surface-2) !important;
}

body.dark h1, body.dark h2, body.dark h3, body.dark h4, body.dark p {
    color: var(--admin-text) !important;
}
`;
    fs.writeFileSync('public/css/admin-dashboard.css', f);
}
