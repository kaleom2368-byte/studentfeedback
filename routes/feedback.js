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
                success: false,
                message: "Failed to load faculty"
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

    console.log("========== FEEDBACK SUBMISSION ==========");

    if (!req.session.student) {

        console.log("❌ Student session missing");

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


    console.log("Student ID:", req.session.student.student_id);

    console.log("Faculty ID:", faculty_id);

    console.log("Department:", department);

    console.log("Subject:", subject);


    // =====================================
    // REQUIRED FIELD CHECK
    // =====================================

    const missingFields = [];


    if (!faculty_id || !String(faculty_id).trim()) {
        missingFields.push("faculty_id");
    }

    if (!department || !String(department).trim()) {
        missingFields.push("department");
    }

    if (!subject || !String(subject).trim()) {
        missingFields.push("subject");
    }

    if (!course_satisfaction) {
        missingFields.push("course_satisfaction");
    }

    if (!syllabus_pace) {
        missingFields.push("syllabus_pace");
    }

    if (!concept_clarity) {
        missingFields.push("concept_clarity");
    }

    if (!practical_work) {
        missingFields.push("practical_work");
    }

    if (!study_material) {
        missingFields.push("study_material");
    }

    if (!exam_difficulty) {
        missingFields.push("exam_difficulty");
    }

    if (!faculty_support) {
        missingFields.push("faculty_support");
    }

    if (!improvement) {
        missingFields.push("improvement");
    }


    if (missingFields.length > 0) {

        console.log(
            "❌ Missing feedback fields:",
            missingFields
        );

        return res.status(400).json({

            success: false,

            message:
                "Missing required fields: " +
                missingFields.join(", "),

            missingFields

        });

    }


    // =====================================
    // CONVERT SURVEY ANSWERS TO RATINGS
    // =====================================

    const teaching =
        course_satisfaction === "Excellent" ? 5 :
        course_satisfaction === "Good" ? 4 :
        course_satisfaction === "Average" ? 3 :
        course_satisfaction === "Poor" ? 2 :
        3;


    const communication =
        concept_clarity === "Very Clear" ? 5 :
        concept_clarity === "Mostly Clear" ? 4 :
        concept_clarity === "Rarely Clear" ? 2 :
        3;


    const behaviour =
        faculty_support === "Always Available" ? 5 :
        faculty_support === "Sometimes Available" ? 4 :
        faculty_support === "Rarely Available" ? 3 :
        faculty_support === "Did not Contact" ? 3 :
        3;


    // =====================================
    // INSERT FEEDBACK
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

        VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?
        )

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


    console.log("Saving feedback to database...");


    db.query(
        sql,
        values,
        (err, result) => {

            if (err) {

                console.error(
                    "❌ Feedback Insert Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to submit feedback"

                });

            }


            console.log(
                "✅ Feedback Saved:",
                result.insertId
            );


            console.log(
                "========================================"
            );


            res.json({

                success: true,

                message:
                    "Feedback submitted successfully",

                redirect:
                    "/dashboard/student-dashboard.html?feedback=success"

            });

        }
    );

});


// =====================================
// FEEDBACK HISTORY
// =====================================

router.get("/history", (req, res) => {

    if (!req.session.student) {

        return res.status(401).json({

            success: false,
            message: "Student login required"

        });

    }


    const student_id =
        req.session.student.student_id;


    const sql = `

        SELECT

            feedback.id,
            feedback.faculty_id,
            feedback.department,
            feedback.subject,

            feedback.course_satisfaction,
            feedback.syllabus_pace,
            feedback.concept_clarity,

            feedback.practical_work,
            feedback.study_material,

            feedback.exam_difficulty,
            feedback.faculty_support,

            feedback.improvement,
            feedback.comments,

            feedback.submitted_at,

            faculty.name AS faculty_name

        FROM feedback

        LEFT JOIN faculty

        ON feedback.faculty_id =
           faculty.faculty_id

        WHERE feedback.student_id = ?

        ORDER BY feedback.submitted_at DESC

    `;


    db.query(
        sql,
        [student_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Feedback History Error:",
                    err
                );

                return res.status(500).json({

                    success: false,
                    message:
                        "Failed to load feedback history"

                });

            }


            res.json({

                success: true,

                feedback: result

            });

        }
    );

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


    const student_id =
        req.session.student.student_id;


    const sql = `

        SELECT

            feedback.id,

            feedback.faculty_id,

            feedback.subject,

            feedback.submitted_at,

            faculty.name AS faculty_name

        FROM feedback

        LEFT JOIN faculty

        ON feedback.faculty_id =
           faculty.faculty_id

        WHERE feedback.student_id = ?

        ORDER BY feedback.submitted_at DESC

    `;


    db.query(
        sql,
        [student_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Status Query Error:",
                    err
                );

                return res.json({

                    success: false,
                    message:
                        "Failed to load feedback status"

                });

            }


            res.json({

                success: true,

                count: result.length,

                history: result

            });

        }
    );

});


module.exports = router;