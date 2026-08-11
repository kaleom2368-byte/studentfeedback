const express = require("express");
const router = express.Router();

const db = require("../db");


// =====================================================
// FACULTY LOGIN
// =====================================================

router.post("/login", (req, res) => {

    const {
        faculty_id,
        email,
        department,
        password
    } = req.body;

    console.log("========== FACULTY LOGIN ==========");

    const sql = `
        SELECT
            faculty_id,
            name,
            email,
            password,
            department
        FROM faculty
        WHERE faculty_id = ?
        AND email = ?
        AND department = ?
        AND password = ?
    `;

    db.query(
        sql,
        [
            faculty_id,
            email,
            department,
            password
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "Faculty Login Database Error:",
                    err
                );

                return res
                    .status(500)
                    .send("Database Error");

            }


            if (result.length === 0) {

                console.log(
                    "Invalid Faculty Login"
                );

                return res.redirect(
                    "/auth/faculty.html?error=" +
                    encodeURIComponent(
                        "Invalid Faculty ID, Email, Department or Password"
                    )
                );

            }


            const faculty =
                result[0];


            // =================================================
            // CREATE FACULTY SESSION
            // =================================================

            req.session.faculty = {

                faculty_id:
                    faculty.faculty_id,

                name:
                    faculty.name,

                email:
                    faculty.email,

                department:
                    faculty.department

            };


            console.log(
                "Faculty Login Successful"
            );

            console.log(
                "Faculty ID:",
                faculty.faculty_id
            );

            console.log(
                "Name:",
                faculty.name
            );

            console.log(
                "Department:",
                faculty.department
            );

            console.log(
                "=================================="
            );


            return res.redirect(
                "/dashboard/faculty-dashboard.html"
            );

        }
    );

});


// =====================================================
// FACULTY INFORMATION
// =====================================================
//
// IMPORTANT:
// The faculty table does NOT contain a subject column.
//
// Subjects are stored with submitted feedback, therefore
// subjects are loaded from feedback.subject using the
// logged-in faculty_id.
//
// =====================================================

router.get("/info", (req, res) => {

    console.log(
        "========== FACULTY INFO =========="
    );


    // =================================================
    // CHECK SESSION
    // =================================================

    if (!req.session.faculty) {

        console.log(
            "No faculty session"
        );

        return res.status(401).json({

            success: false,

            message:
                "Faculty login required"

        });

    }


    const faculty =
        req.session.faculty;


    const faculty_id =
        faculty.faculty_id;


    console.log(
        "Faculty session found:",
        faculty_id
    );


    // =================================================
    // GET SUBJECTS FROM FEEDBACK
    // =================================================
    //
    // DISTINCT prevents duplicate subject names.
    //
    // Empty / NULL subjects are ignored.
    //
    // No student identity information is selected.
    // =================================================

    const subjectSql = `

        SELECT DISTINCT
            subject

        FROM feedback

        WHERE faculty_id = ?

        AND subject IS NOT NULL

        AND TRIM(subject) <> ''

        ORDER BY subject ASC

    `;


    db.query(
        subjectSql,
        [faculty_id],
        (err, subjectResult) => {

            if (err) {

                console.error(
                    "Faculty Subject Fetch Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load faculty information"

                });

            }


            // =================================================
            // CREATE CLEAN SUBJECT ARRAY
            // =================================================

            const subjects =
                subjectResult
                    .map(row =>
                        String(
                            row.subject || ""
                        ).trim()
                    )
                    .filter(
                        subject =>
                            subject.length > 0
                    );


            console.log(
                "Faculty Subjects:",
                subjects
            );


            // =================================================
            // RETURN FACULTY INFORMATION
            // =================================================

            return res.json({

                success: true,

                faculty: {

                    faculty_id:
                        faculty.faculty_id,

                    name:
                        faculty.name,

                    email:
                        faculty.email,

                    department:
                        faculty.department,

                    subjects:
                        subjects

                }

            });

        }
    );

});


// =====================================================
// FACULTY FEEDBACK
// =====================================================

router.get("/feedback", (req, res) => {

    console.log(
        "========== FACULTY FEEDBACK REQUEST =========="
    );


    // =================================================
    // CHECK SESSION
    // =================================================

    if (!req.session.faculty) {

        console.log(
            "No faculty session found"
        );

        return res.status(401).json({

            success: false,

            message:
                "Faculty login required"

        });

    }


    const faculty_id =
        req.session.faculty.faculty_id;


    console.log(
        "Faculty ID:",
        faculty_id
    );


    // =================================================
    // GET ANONYMOUS FEEDBACK
    // =================================================
    //
    // IMPORTANT:
    // student_id is intentionally NOT selected.
    //
    // Faculty must NEVER receive student identity data.
    // =================================================

    const sql = `

        SELECT

            id,

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

            comments,

            submitted_at

        FROM feedback

        WHERE faculty_id = ?

        ORDER BY submitted_at DESC

    `;


    db.query(
        sql,
        [faculty_id],
        (err, result) => {

            if (err) {

                console.error(
                    "Faculty Feedback Database Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load feedback"

                });

            }


            console.log(
                "Feedback records found:",
                result.length
            );


            // =================================================
            // ANALYTICS TOTALS
            // =================================================

            let teachingTotal = 0;

            let communicationTotal = 0;

            let behaviourTotal = 0;


            // =================================================
            // STAR DISTRIBUTIONS
            // =================================================

            const teachStars =
                [0, 0, 0, 0, 0];


            const commStars =
                [0, 0, 0, 0, 0];


            const behaveStars =
                [0, 0, 0, 0, 0];


            // =================================================
            // PROCESS FEEDBACK
            // =================================================

            result.forEach(item => {

                const teaching =
                    Number(
                        item.teaching
                    ) || 0;


                const communication =
                    Number(
                        item.communication
                    ) || 0;


                const behaviour =
                    Number(
                        item.behaviour
                    ) || 0;


                teachingTotal +=
                    teaching;


                communicationTotal +=
                    communication;


                behaviourTotal +=
                    behaviour;


                // =============================================
                // TEACHING STAR COUNT
                // =============================================

                if (
                    teaching >= 1 &&
                    teaching <= 5
                ) {

                    teachStars[
                        teaching - 1
                    ]++;

                }


                // =============================================
                // COMMUNICATION STAR COUNT
                // =============================================

                if (
                    communication >= 1 &&
                    communication <= 5
                ) {

                    commStars[
                        communication - 1
                    ]++;

                }


                // =============================================
                // BEHAVIOUR STAR COUNT
                // =============================================

                if (
                    behaviour >= 1 &&
                    behaviour <= 5
                ) {

                    behaveStars[
                        behaviour - 1
                    ]++;

                }

            });


            // =================================================
            // TOTAL FEEDBACK
            // =================================================

            const total =
                result.length;


            // =================================================
            // AVERAGES
            // =================================================

            const teachAverage =
                total > 0
                    ? Number(
                        (
                            teachingTotal /
                            total
                        ).toFixed(1)
                    )
                    : 0;


            const commAverage =
                total > 0
                    ? Number(
                        (
                            communicationTotal /
                            total
                        ).toFixed(1)
                    )
                    : 0;


            const behaveAverage =
                total > 0
                    ? Number(
                        (
                            behaviourTotal /
                            total
                        ).toFixed(1)
                    )
                    : 0;


            // =================================================
            // OVERALL RATING
            // =================================================

            const overall =
                total > 0
                    ? Number(
                        (
                            (
                                teachAverage +
                                commAverage +
                                behaveAverage
                            ) / 3
                        ).toFixed(1)
                    )
                    : 0;


            console.log(
                "Feedback Summary:",
                {

                    total,

                    teachAverage,

                    commAverage,

                    behaveAverage,

                    overall

                }
            );


            // =================================================
            // RESPONSE
            // =================================================

            return res.json({

                success: true,


                // =============================================
                // COUNTS
                // =============================================

                total,

                responses:
                    total,


                // =============================================
                // ROUNDED RATINGS
                // =============================================

                teaching:
                    Math.round(
                        teachAverage
                    ),

                communication:
                    Math.round(
                        commAverage
                    ),

                behaviour:
                    Math.round(
                        behaveAverage
                    ),


                // =============================================
                // EXACT AVERAGES
                // =============================================

                teachAverage,

                commAverage,

                behaveAverage,

                overall,


                // =============================================
                // STAR DISTRIBUTIONS
                // =============================================

                teachStars,

                commStars,

                behaveStars,


                // =============================================
                // ANONYMOUS FEEDBACK
                // =============================================
                //
                // student_id is NOT present.
                //
                // =============================================

                feedback:
                    result

            });

        }
    );

});


// =====================================================
// FACULTY LOGOUT
// =====================================================

router.get("/logout", (req, res) => {

    console.log(
        "========== FACULTY LOGOUT =========="
    );


    req.session.destroy((err) => {

        if (err) {

            console.error(
                "Faculty Logout Error:",
                err
            );

            return res
                .status(500)
                .send("Logout failed");

        }


        res.clearCookie(
            "connect.sid"
        );


        console.log(
            "Faculty logged out successfully"
        );


        return res.redirect(
            "/auth/faculty.html"
        );

    });

});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;