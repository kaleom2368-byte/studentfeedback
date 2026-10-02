const fs = require('fs');
let f = fs.readFileSync('public/js/admin-dashboard.js', 'utf8');

// Replace the inline handlers with data-attributes
f = f.replace(/<td>\$\{c\.status !== 'active'[\\s\\S]*?<\/td>/g, 
  "<td>${c.status !== 'active' ? `<button class=\"action-btn activate-btn cycle-action-btn\" data-action=\"activate\" data-id=\"${c.id}\" data-name=\"${escHTML(c.name)}\">&#9654; Activate</button>` : `<button class=\"action-btn end-btn cycle-action-btn\" data-action=\"end\" data-id=\"${c.id}\" data-name=\"${escHTML(c.name)}\">⏹ End</button>`}</td>");

// Append event listener to table
f = f.replace(/tbody\.innerHTML = cycles\.map[\\s\\S]*?\.join\(''\);/,
  `tbody.innerHTML = cycles.map(c => \`
      <tr>
        <td>\${escHTML(c.name)}</td>
        <td>\${fmtDate(c.start_date)}</td>
        <td>\${fmtDate(c.end_date)}</td>
        <td><span class="status-badge \${c.status === 'active' ? 'badge-active' : 'badge-inactive'}">\${c.status === 'active' ? '🟢 Active' : '⚪ Inactive'}</span></td>
        <td>\${c.status !== 'active' ? \`<button class="action-btn activate-btn cycle-action-btn" data-action="activate" data-id="\${c.id}" data-name="\${escHTML(c.name)}">&#9654; Activate</button>\` : \`<button class="action-btn end-btn cycle-action-btn" data-action="end" data-id="\${c.id}" data-name="\${escHTML(c.name)}">⏹ End</button>\`}</td>
      </tr>\`).join('');
      
  document.querySelectorAll('.cycle-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'activate') activateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
      if (action === 'end') endCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
    });
  });`);
  
fs.writeFileSync('public/js/admin-dashboard.js', f);

let f2 = fs.readFileSync('public/js/hod-dashboard.js', 'utf8');
f2 = f2.replace(/const actionBtn = isActive[\\s\\S]*?<\/button>\`;/,
  `const actionBtn = isActive
    ? \`<button class="end-btn hod-cycle-action-btn" data-action="end" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">⏹ End</button>\`
    : \`<button class="activate-btn hod-cycle-action-btn" data-action="activate" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">▶ Activate</button>\`;`);

f2 = f2.replace(/cycleTbody\.innerHTML = html;/, 
  `cycleTbody.innerHTML = html;
  document.querySelectorAll('.hod-cycle-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action === 'activate') window.hodActivateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
      if (action === 'end') window.hodEndCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
    });
  });`);

fs.writeFileSync('public/js/hod-dashboard.js', f2);
