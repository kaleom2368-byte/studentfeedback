const fs = require('fs');
let hodCode = fs.readFileSync('routes/hod.js', 'utf8');

const hodDeleteRoute = `
// DELETE /hod/cycles/:id
router.delete("/cycles/:id", async (req, res) => {
    if (!req.session || !req.session.hod) return res.status(401).json({ success: false, message: "HOD not logged in" });
    try {
        await db.query('DELETE FROM feedback_cycles WHERE id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Cycle deleted successfully' });
    } catch (err) {
        console.error('Delete cycle error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete cycle' });
    }
});
`;

if (!hodCode.includes('DELETE /hod/cycles/:id')) {
    hodCode = hodCode.replace(/module\.exports = router;/, hodDeleteRoute + '\nmodule.exports = router;');
    fs.writeFileSync('routes/hod.js', hodCode);
}

let dashboardCode = fs.readFileSync('public/js/hod-dashboard.js', 'utf8');
if (!dashboardCode.includes('data-action="delete"')) {
    dashboardCode = dashboardCode.replace(/<td>\$\{actionBtn\}<\/td>/g, 
    `<td>\${actionBtn} <button class="end-btn hod-cycle-action-btn" style="background:#ef4444;margin-left:5px" data-action="delete" data-id="\${c.id}" data-name="\${escapeHTML(c.name)}" type="button">🗑 Delete</button></td>`);
    
    dashboardCode = dashboardCode.replace(/if \(action === 'end'\) window\.hodEndCycle\(btn\.getAttribute\('data-id'\), btn\.getAttribute\('data-name'\)\);/,
    `if (action === 'end') window.hodEndCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
                if (action === 'delete') window.hodDeleteCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));`);

    dashboardCode += `
window.hodDeleteCycle = async function(id, name) {
    if (!confirm(\`Delete cycle "\${name}" permanently?\`)) return;
    try {
        const res = await fetch(\`/hod/cycles/\${id}\`, { method: "DELETE", credentials: "same-origin" });
        const data = await res.json();
        if (data.success) { showHODCycleMsg("✅ Deleted: " + name, "success"); loadCycles(); }
        else showHODCycleMsg(data.message || "Failed to delete.", "error");
    } catch { showHODCycleMsg("Network error.", "error"); }
};
`;
    fs.writeFileSync('public/js/hod-dashboard.js', dashboardCode);
}
