const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// STUDENT DASHBOARD STATS
// =====================================
//
// feedback = anonymous feedback
// feedback_submissions = participation tracking
//
// DO NOT query student_id from feedback.
// Student-specific information comes only
// from feedback_submissions.
// =====================================

router.get("/stats", async (req, res) => {
    // =====================================
    // CHECK STUDENT SESSION
    // =====================================

    if (!req.session || !req.session.student) {
        return res.status(401).json({
            success: false,
            message: "Student not logged in"
        });
    }

    const studentId = req.session.student.student_id;

    try {
        // =====================================
        // FIND ACTIVE FEEDBACK CYCLE
        // =====================================

        const cycleSql = `
            SELECT
                id,
                name,
                start_date,
                end_date
            FROM feedback_cycles
            WHERE status = 'active'
            ORDER BY start_date DESC, id DESC
        `;

        const cycleResult = await db.query(cycleSql);

        const cycles = cycleResult.rows || [];

        // =====================================
        // NO ACTIVE CYCLE
        // =====================================

        if (cycles.length === 0) {
            return res.json({
                success: true,
                feedbackCount: 0,
                facultyCount: 0
            });
        }

        // =====================================
        // USE MOST RECENT ACTIVE CYCLE
        // =====================================

        const activeCycle = cycles[0];

        if (cycles.length > 1) {
            console.warn(
                "⚠ Multiple active feedback cycles detected. " +
                "Using the most recent active cycle:",
                activeCycle.id
            );
        }

        const cycleId = activeCycle.id;

        // =====================================
        // GET STUDENT PARTICIPATION STATS
        // =====================================
        //
        // feedbackCount = number of submissions
        //
        // facultyCount = number of different
        // faculty members evaluated
        //
        // Student identity is ONLY used here.
        // =====================================

        const statsSql = `
            SELECT
                COUNT(*) AS "feedbackCount",
                COUNT(DISTINCT faculty_id) AS "facultyCount"
            FROM feedback_submissions
            WHERE student_id = $1
            AND cycle_id = $2
        `;

        const statsResult = await db.query(
            statsSql,
            [studentId, cycleId]
        );

        const stats = statsResult.rows[0] || {};

        // =====================================
        // SEND DASHBOARD STATS
        // =====================================

        return res.json({
            success: true,
            feedbackCount: Number(stats.feedbackCount || 0),
            facultyCount: Number(stats.facultyCount || 0)
        });

    } catch (error) {
        console.error(
            "❌ Dashboard Stats Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics"
        });
    }
});


// =====================================
// CHECK FACULTY SESSION
// =====================================

router.get("/faculty-session", (req, res) => {

    // =====================================
    // NO FACULTY SESSION
    // =====================================

    if (!req.session || !req.session.faculty) {
        return res.json({
            logged: false
        });
    }

    // =====================================
    // FACULTY SESSION EXISTS
    // =====================================

    return res.json({
        logged: true,
        faculty: req.session.faculty
    });
});


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;