const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// STUDENT DASHBOARD STATS
// =====================================

router.get("/stats", (req, res) => {

    if (!req.session.student) {

        return res.status(401).json({
            success: false,
            message: "Student not logged in"
        });

    }

    const student_id = req.session.student.student_id;

    const sql = `
        SELECT
            COUNT(*) AS feedbackCount,
            COUNT(DISTINCT faculty_id) AS facultyCount
        FROM feedback
        WHERE student_id = ?
    `;

    db.query(sql, [student_id], (err, result) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false
            });

        }

        res.json({

            success: true,

            feedbackCount: result[0].feedbackCount,

            facultyCount: result[0].facultyCount

        });

    });

});


// =====================================
// CHECK FACULTY SESSION
// =====================================

router.get("/faculty-session", (req, res) => {

    if (!req.session.faculty) {

        return res.json({
            logged: false
        });

    }

    res.json({

        logged: true,

        faculty: req.session.faculty

    });

});

module.exports = router;