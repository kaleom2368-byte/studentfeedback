const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    if (!req.session.student) {
        return res.status(401).json({ success: false, message: 'Student not logged in' });
    }
    const department = req.session.student.department;
    if (!department) {
        return res.status(400).json({ success: false, message: 'Student department not found' });
    }
    try {
        const result = await db.query(
            `SELECT faculty_id, name, email, department FROM faculty WHERE LOWER(TRIM(department)) = LOWER(TRIM($1)) ORDER BY name ASC`,
            [department]
        );
        return res.json({ success: true, faculty: result.rows });
    } catch (err) {
        console.error('Faculty Directory Error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;