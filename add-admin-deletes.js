const fs = require('fs');
let code = fs.readFileSync('routes/admin.js', 'utf8');

const deleteRoutes = `
// =====================================================
// ADMIN DELETION ROUTES
// =====================================================

// DELETE /admin/cycles/:id
router.delete("/cycles/:id", requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM feedback_cycles WHERE id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Cycle deleted successfully' });
    } catch (err) {
        console.error('Delete cycle error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete cycle' });
    }
});

// DELETE /admin/students/:id
router.delete("/students/:id", requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE student_id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        console.error('Delete student error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
});

// DELETE /admin/faculty/:id
router.delete("/faculty/:id", requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM faculty WHERE faculty_id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Faculty deleted successfully' });
    } catch (err) {
        console.error('Delete faculty error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete faculty' });
    }
});
`;

if (!code.includes('ADMIN DELETION ROUTES')) {
    code = code.replace(/module\.exports = router;/, deleteRoutes + '\nmodule.exports = router;');
    fs.writeFileSync('routes/admin.js', code);
}
