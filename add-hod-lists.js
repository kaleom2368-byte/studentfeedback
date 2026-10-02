const fs = require('fs');

const extraCode = `

/* =========================================================
   MISSING STUDENTS
========================================================= */

async function loadMissingStudents() {
    const container = document.getElementById("missing-list");
    const countEl = document.getElementById("missing-count");
    if (!container) return;
    
    container.innerHTML = \`<div class="loading"><div class="loading-spinner"></div><span>Loading students...</span></div>\`;
    
    try {
        const response = await fetch("/hod/missing-students", { method: "GET", credentials: "same-origin" });
        if (response.status === 401) { redirectToHODLogin(); return; }
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            container.innerHTML = \`<div class="empty-state"><p>\${escapeHTML(data.message || "Failed to load missing students.")}</p></div>\`;
            return;
        }
        
        const missing = data.missingStudents || [];
        if (countEl) countEl.textContent = missing.length;
        
        if (missing.length === 0) {
            container.innerHTML = \`<div class="empty-state"><h3>All Caught Up!</h3><p>All students have submitted their feedback.</p></div>\`;
            return;
        }
        
        const rows = missing.map(s => \`
            <tr>
                <td>\${escapeHTML(s.student_id)}</td>
                <td>\${escapeHTML(s.name)}</td>
                <td>\${escapeHTML(String(s.year))}</td>
                <td>\${escapeHTML(s.division)}</td>
            </tr>
        \`).join("");
        
        container.innerHTML = \`
            <table class="hod-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Year</th>
                        <th>Division</th>
                    </tr>
                </thead>
                <tbody>\${rows}</tbody>
            </table>
        \`;
        
    } catch (err) {
        console.error("Missing students error:", err);
        container.innerHTML = \`<div class="empty-state"><p>Network error.</p></div>\`;
    }
}

/* =========================================================
   SENT MESSAGES
========================================================= */

async function loadMessages() {
    const container = document.getElementById("replies-list");
    if (!container) return;
    
    container.innerHTML = \`<div class="loading"><div class="loading-spinner"></div><span>Loading messages...</span></div>\`;
    
    try {
        const response = await fetch("/hod/auto-replies", { method: "GET", credentials: "same-origin" });
        if (response.status === 401) { redirectToHODLogin(); return; }
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            container.innerHTML = \`<div class="empty-state"><p>\${escapeHTML(data.message || "Failed to load messages.")}</p></div>\`;
            return;
        }
        
        const msgs = data.messages || [];
        if (msgs.length === 0) {
            container.innerHTML = \`<div class="empty-state"><h3>No Messages Sent</h3><p>You haven't sent any auto-replies yet.</p></div>\`;
            return;
        }
        
        const rows = msgs.map(m => {
            const isCongrats = m.type === "congratulate";
            const badge = isCongrats ? \`<span class="type-badge badge-congrat">🎉 Congratulate</span>\` : \`<span class="type-badge badge-improve">📈 Improve</span>\`;
            return \`
                <tr>
                    <td>\${escapeHTML(m.faculty_name)}</td>
                    <td>\${escapeHTML(m.faculty_id)}</td>
                    <td>\${badge}</td>
                    <td>\${formatCycleDate(m.sent_at)}</td>
                </tr>
            \`;
        }).join("");
        
        container.innerHTML = \`
            <table class="hod-table">
                <thead>
                    <tr>
                        <th>Faculty Name</th>
                        <th>Faculty ID</th>
                        <th>Type</th>
                        <th>Sent Date</th>
                    </tr>
                </thead>
                <tbody>\${rows}</tbody>
            </table>
        \`;
        
    } catch (err) {
        console.error("Messages error:", err);
        container.innerHTML = \`<div class="empty-state"><p>Network error.</p></div>\`;
    }
}
`;

let code = fs.readFileSync('public/js/hod-dashboard.js', 'utf8');

// Insert calls into DOMContentLoaded
code = code.replace(/loadDashboard\(\);/, 'loadDashboard();\n        loadMissingStudents();\n        loadMessages();');

code += extraCode;

fs.writeFileSync('public/js/hod-dashboard.js', code);
