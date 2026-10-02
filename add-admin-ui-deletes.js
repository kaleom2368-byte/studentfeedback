const fs = require('fs');
let code = fs.readFileSync('public/js/admin-dashboard.js', 'utf8');

// 1. Add delete action to cycles
if (!code.includes('data-action="delete"')) {
    code = code.replace(/<span class="status-badge \$\{c\.status === 'active' \? 'badge-active' : 'badge-inactive'\}">\$\{c\.status === 'active' \? '🟢 Active' : '⚪ Inactive'\}<\/span><\/td>\s*<td>\$\{actionBtn\}<\/td>/,
`<span class="status-badge \${c.status === 'active' ? 'badge-active' : 'badge-inactive'}">\${c.status === 'active' ? '🟢 Active' : '⚪ Inactive'}</span></td>
        <td>\${actionBtn} <button class="action-btn admin-cycle-btn" style="background:#ef4444;margin-left:5px;" data-action="delete" data-id="\${c.id}" data-name="\${escHTML(c.name)}">🗑 Delete</button></td>`);
        
    code = code.replace(/if \(action === 'end'\) window\.endCycle\(btn\.getAttribute\('data-id'\), btn\.getAttribute\('data-name'\)\);/,
`if (action === 'end') window.endCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
        if (action === 'delete') window.deleteCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));`);
        
    code += `
window.deleteCycle = async function(id, name) {
    if (!confirm(\`Delete cycle "\${name}" permanently?\`)) return;
    try {
        const res = await fetch(\`/admin/cycles/\${id}\`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) { showMsg('cycle-message', '✅ Deleted: ' + name, 'success'); loadCycles(); }
        else showMsg('cycle-message', data.message || 'Failed to delete.', 'error');
    } catch { showMsg('cycle-message', 'Network error.', 'error'); }
};
`;
}

// 2. Add delete column to students table
if (!code.includes('deleteStudent')) {
    // Modify student header (we need to find where the table is built)
    code = code.replace(/<table class="admin-table"><thead><tr><th>ID<\/th><th>Name<\/th><th>Email<\/th><th>Dept<\/th><th>Year<\/th><th>Div<\/th><\/tr><\/thead><tbody>/,
    `<table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Div</th><th>Action</th></tr></thead><tbody id="student-tbody">`);
    
    // Modify student row
    code = code.replace(/students\.map\(s => \`<tr><td>\$\{escHTML\(s\.student_id\)\}<\/td><td>\$\{escHTML\(s\.name\)\}<\/td><td>\$\{escHTML\(s\.email\)\}<\/td><td>\$\{escHTML\(s\.department\)\}<\/td><td>\$\{escHTML\(String\(s\.year\)\)\}<\/td><td>\$\{escHTML\(s\.division\)\}<\/td><\/tr>\`\)/,
    `students.map(s => \`<tr><td>\${escHTML(s.student_id)}</td><td>\${escHTML(s.name)}</td><td>\${escHTML(s.email)}</td><td>\${escHTML(s.department)}</td><td>\${escHTML(String(s.year))}</td><td>\${escHTML(s.division)}</td><td><button style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem" onclick="deleteStudent('\${s.student_id}', '\${escHTML(s.name)}')">Delete</button></td></tr>\`)`);

    code += `
window.deleteStudent = async function(id, name) {
    if (!confirm(\`Delete student "\${name}" (\${id}) permanently?\`)) return;
    try {
        const res = await fetch(\`/admin/students/\${id}\`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) { alert('Deleted student successfully'); loadUsers(); }
        else alert(data.message || 'Failed to delete.');
    } catch { alert('Network error.'); }
};
`;
}

// 3. Add delete column to faculty table
if (!code.includes('deleteFaculty')) {
    // Modify faculty header
    code = code.replace(/<table class="admin-table"><thead><tr><th>ID<\/th><th>Name<\/th><th>Email<\/th><th>Dept<\/th><th>Subject<\/th><\/tr><\/thead><tbody>/,
    `<table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Subject</th><th>Action</th></tr></thead><tbody id="faculty-tbody">`);
    
    // Modify faculty row
    code = code.replace(/faculty\.map\(f => \`<tr><td>\$\{escHTML\(f\.faculty_id\)\}<\/td><td>\$\{escHTML\(f\.name\)\}<\/td><td>\$\{escHTML\(f\.email\)\}<\/td><td>\$\{escHTML\(f\.department\)\}<\/td><td>\$\{escHTML\(f\.subject \|\| '--'\)\}<\/td><\/tr>\`\)/,
    `faculty.map(f => \`<tr><td>\${escHTML(f.faculty_id)}</td><td>\${escHTML(f.name)}</td><td>\${escHTML(f.email)}</td><td>\${escHTML(f.department)}</td><td>\${escHTML(f.subject || '--')}</td><td><button style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem" onclick="deleteFaculty('\${f.faculty_id}', '\${escHTML(f.name)}')">Delete</button></td></tr>\`)`);

    code += `
window.deleteFaculty = async function(id, name) {
    if (!confirm(\`Delete faculty "\${name}" (\${id}) permanently?\`)) return;
    try {
        const res = await fetch(\`/admin/faculty/\${id}\`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) { alert('Deleted faculty successfully'); loadUsers(); }
        else alert(data.message || 'Failed to delete.');
    } catch { alert('Network error.'); }
};
`;
}

fs.writeFileSync('public/js/admin-dashboard.js', code);
