/* Admin Dashboard JS */

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadAdminInfo();
  loadCycles();
  loadUsers();
  setupCreateCycle();
  setupCreateStudent();
  setupCreateFaculty();
  setupResetPassword();
  document.getElementById('refresh-cycles-btn')?.addEventListener('click', loadCycles);
});

// --- TABS ---
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

// --- ADMIN INFO ---
async function loadAdminInfo() {
  try {
    const res = await fetch('/admin/info', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok || !data.success) { window.location.href = '/auth/adminfile.html'; return; }
    const el = document.getElementById('admin-username');
    if (el) el.textContent = 'Logged in as: ' + (data.admin.username || 'Admin');
  } catch (e) { window.location.href = '/auth/adminfile.html'; }
}

// --- LOAD CYCLES ---
async function loadCycles() {
  const tbody = document.getElementById('cycle-list');
  const badge = document.getElementById('cycle-status-badge');
  const currentCard = document.getElementById('current-cycle-content');
  if (tbody) tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
  try {
    const res = await fetch('/admin/cycles', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok || !data.success) { if (tbody) tbody.innerHTML = "<tr><td colspan='5'>Failed to load cycles.</td></tr>"; return; }
    const cycles = data.cycles || [];
    const active = cycles.find(c => c.status === 'active');
    setText('stat-cycles', cycles.length);
    if (active) {
      if (badge) { badge.textContent = '🟢 Active Cycle'; badge.className = 'cycle-status active'; }
      if (currentCard) currentCard.innerHTML = `
        <div class="cycle-info-row"><span class="cycle-info-label">Name</span><span class="cycle-info-value">${escHTML(active.name)}</span></div>
        <div class="cycle-info-row"><span class="cycle-info-label">Start</span><span class="cycle-info-value">${fmtDate(active.start_date)}</span></div>
        <div class="cycle-info-row"><span class="cycle-info-label">End</span><span class="cycle-info-value">${fmtDate(active.end_date)}</span></div>
        <div class="cycle-info-row"><span class="cycle-info-label">Status</span><span class="cycle-info-value status-active">Active</span></div>`;
    } else {
      if (badge) { badge.textContent = 'No Active Cycle'; badge.className = 'cycle-status inactive'; }
      if (currentCard) currentCard.innerHTML = `<p class="cycle-empty">No feedback cycle is currently active.</p>`;
    }
    if (!tbody) return;
    if (cycles.length === 0) { tbody.innerHTML = "<tr><td colspan='5'>No cycles found.</td></tr>"; return; }
    tbody.innerHTML = cycles.map(c => {
    const actionBtn = c.status !== 'active'
        ? `<button class="action-btn activate-btn admin-cycle-btn" data-action="activate" data-id="${c.id}" data-name="${escHTML(c.name)}">▶ Activate</button>`
        : `<button class="action-btn end-btn admin-cycle-btn" data-action="end" data-id="${c.id}" data-name="${escHTML(c.name)}">⏹ End</button>`;
    return `<tr>
        <td>${escHTML(c.name)}</td>
        <td>${fmtDate(c.start_date)}</td>
        <td>${fmtDate(c.end_date)}</td>
        <td><span class="status-badge ${c.status === 'active' ? 'badge-active' : 'badge-inactive'}">${c.status === 'active' ? '🟢 Active' : '⚪ Inactive'}</span></td>
        <td>${actionBtn} <button class="action-btn admin-cycle-btn" style="background:#ef4444;margin-left:5px;" data-action="delete" data-id="${c.id}" data-name="${escHTML(c.name)}">🗑 Delete</button></td>
    </tr>`;
}).join('');

document.querySelectorAll('.admin-cycle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'activate') window.activateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
        if (action === 'end') window.endCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
        if (action === 'delete') window.deleteCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
    });
});
  } catch (err) { if (tbody) tbody.innerHTML = "<tr><td colspan='5'>Error loading cycles.</td></tr>"; }
}

// --- SETUP CREATE CYCLE ---
function setupCreateCycle() {
  const btn = document.getElementById('create-cycle-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const name = document.getElementById('cycle-name')?.value.trim();
    const start = document.getElementById('cycle-start-date')?.value;
    const end = document.getElementById('cycle-end-date')?.value;
    if (!name || !start || !end) { showMsg('cycle-message', 'Please fill all fields.', 'error'); return; }
    if (end < start) { showMsg('cycle-message', 'End date cannot be before start date.', 'error'); return; }
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const res = await fetch('/admin/cycles/create', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, start_date: start, end_date: end })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { showMsg('cycle-message', data.message || 'Failed.', 'error'); }
      else {
        showMsg('cycle-message', '✅ Cycle created: ' + data.cycle.name, 'success');
        document.getElementById('cycle-name').value = '';
        document.getElementById('cycle-start-date').value = '';
        document.getElementById('cycle-end-date').value = '';
        loadCycles();
      }
    } catch { showMsg('cycle-message', 'Network error.', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Create Cycle'; }
  });
}

window.activateCycle = async function activateCycle(id, name) {
  if (!confirm(`Activate "${name}"? This will deactivate any currently active cycle.`)) return;
  try {
    const res = await fetch(`/admin/cycles/${id}/activate`, { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (data.success) { showMsg('cycle-message', '✅ Activated: ' + name, 'success'); loadCycles(); }
    else showMsg('cycle-message', data.message || 'Failed.', 'error');
  } catch { showMsg('cycle-message', 'Network error.', 'error'); }
}

window.endCycle = async function endCycle(id, name) {
  if (!confirm(`End "${name}"? Students will not be able to submit feedback.`)) return;
  try {
    const res = await fetch(`/admin/cycles/${id}/end`, { method: 'POST', credentials: 'same-origin' });
    const data = await res.json();
    if (data.success) { showMsg('cycle-message', '✅ Ended: ' + name, 'success'); loadCycles(); }
    else showMsg('cycle-message', data.message || 'Failed.', 'error');
  } catch { showMsg('cycle-message', 'Network error.', 'error'); }
}

// --- LOAD USERS ---
async function loadUsers() {
  try {
    const res = await fetch('/admin/users', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok || !data.success) return;
    setText('stat-students', data.students.length);
    setText('stat-faculty', data.faculty.length);
    setText('stat-hods', data.hods.length);
    renderStudentsTable(data.students);
    renderFacultyTable(data.faculty);
  } catch (err) { console.error('Load users error:', err); }
}

function renderStudentsTable(students) {
  const wrapper = document.getElementById('students-table-wrapper');
  if (!wrapper) return;
  if (students.length === 0) { wrapper.innerHTML = '<p>No students found.</p>'; return; }
  wrapper.innerHTML = `<table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Div</th><th>Action</th></tr></thead><tbody id="student-tbody">${
    students.map(s => `<tr><td>${escHTML(s.student_id)}</td><td>${escHTML(s.name)}</td><td>${escHTML(s.email)}</td><td>${escHTML(s.department)}</td><td>${escHTML(String(s.year))}</td><td>${escHTML(s.division)}</td><td><button style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem" onclick="deleteStudent('${s.student_id}', '${escHTML(s.name)}')">Delete</button></td></tr>`).join('')
  }</tbody></table><p style="font-size:0.8rem;color:#9ca3af;margin-top:0.5rem">${students.length} students</p>`;
}

function renderFacultyTable(faculty) {
  const wrapper = document.getElementById('faculty-table-wrapper');
  if (!wrapper) return;
  if (faculty.length === 0) { wrapper.innerHTML = '<p>No faculty found.</p>'; return; }
  wrapper.innerHTML = `<table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Subject</th><th>Action</th></tr></thead><tbody id="faculty-tbody">${
    faculty.map(f => `<tr><td>${escHTML(f.faculty_id)}</td><td>${escHTML(f.name)}</td><td>${escHTML(f.email)}</td><td>${escHTML(f.department)}</td><td>${escHTML(f.subject || '--')}</td><td><button style="padding:4px 8px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem" onclick="deleteFaculty('${f.faculty_id}', '${escHTML(f.name)}')">Delete</button></td></tr>`).join('')
  }</tbody></table><p style="font-size:0.8rem;color:#9ca3af;margin-top:0.5rem">${faculty.length} faculty members</p>`;
}

// --- CREATE STUDENT ---
function setupCreateStudent() {
  const btn = document.getElementById('create-student-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const student_id = document.getElementById('ns-id')?.value.trim();
    const name = document.getElementById('ns-name')?.value.trim();
    const email = document.getElementById('ns-email')?.value.trim();
    const department = document.getElementById('ns-dept')?.value.trim();
    const year = document.getElementById('ns-year')?.value;
    const division = document.getElementById('ns-div')?.value;
    if (!student_id || !name || !email || !department || !year || !division) {
      showMsg('student-create-msg', 'Please fill all fields.', 'error'); return;
    }
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const res = await fetch('/admin/create-student', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, name, email, department, year, division })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { showMsg('student-create-msg', data.message || 'Failed.', 'error'); }
      else {
        showMsg('student-create-msg', '✅ ' + data.message, 'success');
        document.getElementById('ns-id').value = '';
        document.getElementById('ns-name').value = '';
        document.getElementById('ns-email').value = '';
        loadUsers();
      }
    } catch { showMsg('student-create-msg', 'Network error.', 'error'); }
    finally { btn.disabled = false; btn.textContent = '➕ Create Student'; }
  });
}

// --- CREATE FACULTY ---
function setupCreateFaculty() {
  const btn = document.getElementById('create-faculty-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const faculty_id = document.getElementById('nf-id')?.value.trim();
    const name = document.getElementById('nf-name')?.value.trim();
    const email = document.getElementById('nf-email')?.value.trim();
    const department = document.getElementById('nf-dept')?.value.trim();
    const subject = document.getElementById('nf-subject')?.value.trim();
    if (!faculty_id || !name || !email || !department || !subject) {
      showMsg('faculty-create-msg', 'Please fill all fields.', 'error'); return;
    }
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const res = await fetch('/admin/create-faculty', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty_id, name, email, department, subject })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { showMsg('faculty-create-msg', data.message || 'Failed.', 'error'); }
      else {
        showMsg('faculty-create-msg', '✅ ' + data.message, 'success');
        document.getElementById('nf-id').value = '';
        document.getElementById('nf-name').value = '';
        document.getElementById('nf-email').value = '';
        document.getElementById('nf-subject').value = '';
        loadUsers();
      }
    } catch { showMsg('faculty-create-msg', 'Network error.', 'error'); }
    finally { btn.disabled = false; btn.textContent = '➕ Create Faculty'; }
  });
}

// --- RESET PASSWORD ---
function setupResetPassword() {
  const btn = document.getElementById('reset-pw-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const role = document.getElementById('reset-role')?.value;
    const id = document.getElementById('reset-user-id')?.value.trim();
    const newPassword = document.getElementById('reset-new-pw')?.value;
    if (!role || !id || !newPassword) { showMsg('reset-pw-msg', 'Please fill all fields.', 'error'); return; }
    if (newPassword.length < 6) { showMsg('reset-pw-msg', 'Password must be at least 6 characters.', 'error'); return; }
    if (!confirm(`Reset password for ${role}: ${id}?`)) return;
    btn.disabled = true; btn.textContent = 'Resetting…';
    try {
      const res = await fetch('/admin/reset-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, id, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { showMsg('reset-pw-msg', data.message || 'Failed.', 'error'); }
      else {
        showMsg('reset-pw-msg', '✅ ' + data.message, 'success');
        document.getElementById('reset-user-id').value = '';
        document.getElementById('reset-new-pw').value = '';
      }
    } catch { showMsg('reset-pw-msg', 'Network error.', 'error'); }
    finally { btn.disabled = false; btn.textContent = '🔒 Reset Password'; }
  });
}

// --- HELPERS ---
function showMsg(id, message, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = type === 'error' ? 'msg-error' : 'msg-success';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value ?? '');
}

function escHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtDate(dateStr) {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return String(dateStr); }
}

window.deleteCycle = async function(id, name) {
    if (!confirm(`Delete cycle "${name}" permanently?`)) return;
    try {
        const res = await fetch(`/admin/cycles/${id}`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) { showMsg('cycle-message', '✅ Deleted: ' + name, 'success'); loadCycles(); }
        else showMsg('cycle-message', data.message || 'Failed to delete.', 'error');
    } catch { showMsg('cycle-message', 'Network error.', 'error'); }
};

window.deleteStudent = async function(id, name) {
    if (!confirm(`Delete student "${name}" (${id}) permanently?`)) return;
    try {
        const res = await fetch(`/admin/students/${id}`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) { alert('Deleted student successfully'); loadUsers(); }
        else alert(data.message || 'Failed to delete.');
    } catch { alert('Network error.'); }
};

window.deleteFaculty = async function(id, name) {
    if (!confirm(`Delete faculty "${name}" (${id}) permanently?`)) return;
    try {
        const res = await fetch(`/admin/faculty/${id}`, { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.success) { alert('Deleted faculty successfully'); loadUsers(); }
        else alert(data.message || 'Failed to delete.');
    } catch { alert('Network error.'); }
};
