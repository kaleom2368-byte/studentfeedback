const fs = require('fs');
let code = fs.readFileSync('public/js/admin-dashboard.js', 'utf8');

code = code.replace(/tbody\.innerHTML = cycles\.map\([\s\S]*?\.join\(''\);/,
`tbody.innerHTML = cycles.map(c => {
    const actionBtn = c.status !== 'active'
        ? \`<button class="action-btn activate-btn admin-cycle-btn" data-action="activate" data-id="\${c.id}" data-name="\${escHTML(c.name)}">▶ Activate</button>\`
        : \`<button class="action-btn end-btn admin-cycle-btn" data-action="end" data-id="\${c.id}" data-name="\${escHTML(c.name)}">⏹ End</button>\`;
    return \`<tr>
        <td>\${escHTML(c.name)}</td>
        <td>\${fmtDate(c.start_date)}</td>
        <td>\${fmtDate(c.end_date)}</td>
        <td><span class="status-badge \${c.status === 'active' ? 'badge-active' : 'badge-inactive'}">\${c.status === 'active' ? '🟢 Active' : '⚪ Inactive'}</span></td>
        <td>\${actionBtn}</td>
    </tr>\`;
}).join('');

document.querySelectorAll('.admin-cycle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'activate') window.activateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
        if (action === 'end') window.endCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
    });
});`);

fs.writeFileSync('public/js/admin-dashboard.js', code);
