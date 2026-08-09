const express = require("express");
const router = express.Router();

const db = require("../db");

// =====================================
// GET FACULTY LIST
// =====================================

router.get("/faculty", (req, res) => {

    const sql = `
        SELECT
            faculty_id,
            name,
            department
        FROM faculty
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.error("Faculty Fetch Error:", err);

            return res.status(500).json({
                success: false
            });

        }

        res.json({

            success: true,
            faculty: result

        });

    });

});



// =====================================
// SUBMIT FEEDBACK
// =====================================

router.post("/submit", (req, res) => {

    if (!req.session.student) {

        return res.status(401).json({

            success: false,
            message: "Student login required"

        });

    }

    const {

        faculty_id,
        department,
        subject,

        course_satisfaction,
        syllabus_pace,
        concept_clarity,

        practical_work,
        study_material,

        exam_difficulty,
        faculty_support,

        improvement,
        comments

    } = req.body;

    // =====================================
    // Convert survey answers into ratings
    // (for existing faculty dashboard)
    // =====================================

    const teaching =
        course_satisfaction === "Excellent" ? 5 :
        course_satisfaction === "Good" ? 4 :
        course_satisfaction === "Average" ? 3 :
        2;

    const communication =
        concept_clarity === "Very clear; easy to follow" ? 5 :
        concept_clarity === "Mostly clear; occasionally confusing" ? 4 :
        concept_clarity === "Rarely clear; hard to follow" ? 2 :
        3;

    const behaviour =
        faculty_support === "Always accessible and helpful" ? 5 :
        faculty_support === "Sometimes accessible" ? 4 :
        faculty_support === "Rarely accessible" ? 3 :
        faculty_support === "Did not attempt to contact" ? 3 :
        3;

    // =====================================
    // INSERT
    // =====================================

    const sql = `

        INSERT INTO feedback (

            student_id,
            faculty_id,
            department,
            subject,

            teaching,
            communication,
            behaviour,

            course_satisfaction,
            syllabus_pace,
            concept_clarity,

            practical_work,
            study_material,

            exam_difficulty,
            faculty_support,

            improvement,
            comments

        )

        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

    `;

    const values = [

        req.session.student.student_id,

        faculty_id,

        department,

        subject,

        teaching,

        communication,

        behaviour,

        course_satisfaction,

        syllabus_pace,

        concept_clarity,

        practical_work,

        study_material,

        exam_difficulty,

        faculty_support,

        improvement,

        comments

    ];

    db.query(sql, values, (err, result) => {

        if (err) {

            console.error("Feedback Insert Error:", err);

            return res.status(500).json({

                success: false,
                message: "Failed to submit feedback"

            });

        }

        console.log("Feedback Saved:", result.insertId);

        res.json({

            success: true,

            redirect: "/dashboard/student-dashboard.html?feedback=success"

        });

    });

});



// =====================================
// FEEDBACK HISTORY
// =====================================

router.get("/history", (req, res) => {

    res.json({

        success: true,
        feedback: []

    });

});



// =====================================
// FEEDBACK STATUS
// =====================================

router.get("/status", (req, res) => {

    if (!req.session.student) {

        return res.json({

            success: false,
            message: "Not Logged In"

        });

    }

    const student_id = req.session.student.student_id;

    const sql = `

        SELECT

            feedback.faculty_id,
            feedback.subject,
            feedback.submitted_at,

            faculty.name AS faculty_name

        FROM feedback

        JOIN faculty

        ON feedback.faculty_id = faculty.faculty_id

        WHERE feedback.student_id = ?

        ORDER BY feedback.submitted_at DESC

    `;

    db.query(sql, [student_id], (err, result) => {

        if (err) {

            console.error("Status Query Error:", err);

            return res.json({

                success: false

            });

        }

        res.json({

            success: true,

            count: result.length,

            history: result

        });

    });

});

module.exports = router;