const fs = require('fs');
let code = fs.readFileSync('public/js/hod-dashboard.js', 'utf8');

// The regex will target the `actionBtn` variable block
code = code.replace(/const actionBtn = isActive[\s\S]*?Activate<\/button>\`;/,
`const actionBtn = isActive
    ? \`<button class="end-btn hod-cycle-action-btn" data-action="end" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">⏹ End</button>\`
    : \`<button class="activate-btn hod-cycle-action-btn" data-action="activate" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">▶ Activate</button>\`;`);

// Then replace the container HTML block and inject event listeners
code = code.replace(/container\.innerHTML = `[\s\S]*?<\/tbody>\s*<\/table>\s*`;/,
`container.innerHTML = \`
            <table class="hod-table">
                <thead>
                    <tr>
                        <th>Cycle Name</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    \${rows}
                </tbody>
            </table>
        \`;
        
        // Wire up event delegation
        document.querySelectorAll('.hod-cycle-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                if (action === 'activate') window.hodActivateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
                if (action === 'end') window.hodEndCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
            });
        });`);

fs.writeFileSync('public/js/hod-dashboard.js', code);
