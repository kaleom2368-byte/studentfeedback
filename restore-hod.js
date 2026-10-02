const fs = require('fs');

const extraCode = `

// ==========================================
// HOD CYCLE LOGIC
// ==========================================

function formatCycleDate(dateStr) {
    if (!dateStr) return "--";
    try {
        const d = new Date(dateStr);
        return isNaN(d) ? dateStr : d.toLocaleDateString();
    } catch {
        return dateStr;
    }
}

function showHODCycleMsg(message, type) {
    const el = document.getElementById("hod-cycle-msg");
    if (!el) return;
    el.textContent = message;
    el.className = type === "error" ? "cycle-message-error" : "cycle-message-success";
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 6000);
}

window.hodActivateCycle = async function hodActivateCycle(id, name) {
    if (!confirm(\`Activate cycle "\${name}"?\\nThis will deactivate any currently active cycle.\`)) return;
    try {
        const res = await fetch(\`/hod/cycles/\${id}/activate\`, { method: "POST", credentials: "same-origin" });
        const data = await res.json();
        if (data.success) {
            showHODCycleMsg("✅ Cycle activated: " + name, "success");
            loadCycles();
        } else {
            showHODCycleMsg(data.message || "Failed to activate.", "error");
        }
    } catch (err) {
        showHODCycleMsg("Network error.", "error");
    }
}

window.hodEndCycle = async function hodEndCycle(id, name) {
    if (!confirm(\`End cycle "\${name}"?\\nStudents will no longer be able to submit feedback.\`)) return;
    try {
        const res = await fetch(\`/hod/cycles/\${id}/end\`, { method: "POST", credentials: "same-origin" });
        const data = await res.json();
        if (data.success) {
            showHODCycleMsg("✅ Cycle ended: " + name, "success");
            loadCycles();
        } else {
            showHODCycleMsg(data.message || "Failed to end cycle.", "error");
        }
    } catch (err) {
        showHODCycleMsg("Network error.", "error");
    }
}

async function loadCycles() {
    const container = document.getElementById("cycles-list");
    if (!container) return;
    
    container.innerHTML = \`<div class="loading"><div class="loading-spinner"></div><span>Loading...</span></div>\`;
    
    try {
        const response = await fetch("/hod/cycles", { method: "GET", credentials: "same-origin" });
        if (response.status === 401) { redirectToHODLogin(); return; }
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            container.innerHTML = \`<div class="empty-state"><p>\${escapeHTML(data.message || "Failed to load cycles.")}</p></div>\`;
            return;
        }
        
        const cycles = data.cycles || [];
        if (cycles.length === 0) {
            container.innerHTML = \`<div class="empty-state"><h3>No Cycles Yet</h3><p>Use the form above to create the first feedback cycle.</p></div>\`;
            return;
        }
        
        const rows = cycles.map(c => {
            const isActive = c.status === "active";
            const actionBtn = isActive
                ? \`<button class="end-btn hod-cycle-action-btn" data-action="end" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">⏹ End</button>\`
                : \`<button class="activate-btn hod-cycle-action-btn" data-action="activate" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">▶ Activate</button>\`;
                
            return \`
                <tr>
                    <td>\${escapeHTML(c.name)}</td>
                    <td>\${formatCycleDate(c.start_date)}</td>
                    <td>\${formatCycleDate(c.end_date)}</td>
                    <td><span class="type-badge \${isActive ? 'badge-congrat' : 'badge-improve'}">\${isActive ? '🟢 Active' : '⚪ Inactive'}</span></td>
                    <td>\${actionBtn}</td>
                </tr>
            \`;
        }).join("");
        
        container.innerHTML = \`
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
        
        document.querySelectorAll('.hod-cycle-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                if (action === 'activate') window.hodActivateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
                if (action === 'end') window.hodEndCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
            });
        });
        
    } catch (err) {
        console.error("Load cycles error:", err);
        container.innerHTML = \`<div class="empty-state"><p>Network error. Please try again.</p></div>\`;
    }
}

function setupHODCreateCycle() {
    const btn = document.getElementById("hod-create-cycle-btn");
    if (!btn) return;
    
    btn.addEventListener("click", async () => {
        const name = document.getElementById("hod-cycle-name")?.value.trim();
        const start = document.getElementById("hod-cycle-start")?.value;
        const end = document.getElementById("hod-cycle-end")?.value;
        
        if (!name || !start || !end) {
            showHODCycleMsg("Please fill all fields.", "error");
            return;
        }
        if (end < start) {
            showHODCycleMsg("End date cannot be before start date.", "error");
            return;
        }
        
        btn.disabled = true;
        btn.textContent = "Creating…";
        
        try {
            const res = await fetch("/hod/cycles/create", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, start_date: start, end_date: end })
            });
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                showHODCycleMsg(data.message || "Failed to create cycle.", "error");
            } else {
                showHODCycleMsg("✅ Cycle created: " + data.cycle.name, "success");
                document.getElementById("hod-cycle-name").value = "";
                document.getElementById("hod-cycle-start").value = "";
                document.getElementById("hod-cycle-end").value = "";
                loadCycles();
            }
        } catch (err) {
            showHODCycleMsg("Network error. Please try again.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Create Cycle";
        }
    });
}
`;

let code = fs.readFileSync('public/js/hod-dashboard.js', 'utf8');

// Insert the initialization into DOMContentLoaded
code = code.replace(/document\.addEventListener\(\s*"DOMContentLoaded"\s*,\s*\(\)\s*=>\s*\{/, 
`document.addEventListener("DOMContentLoaded", () => {
    setupHODCreateCycle();
    loadCycles();`);

code += extraCode;

fs.writeFileSync('public/js/hod-dashboard.js', code);
