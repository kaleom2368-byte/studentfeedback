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
        SELECT *
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
                    "❌ Faculty Login Database Error:",
                    err
                );

                return res
                    .status(500)
                    .send("Database Error");

            }

            if (result.length === 0) {

                console.log(
                    "❌ Invalid Faculty Login"
                );

                return res.redirect(
                    "/auth/faculty.html?error=" +
                    encodeURIComponent(
                        "Invalid Faculty ID, Email, Department or Password"
                    )
                );

            }

            const faculty = result[0];

            // Create faculty session
            req.session.faculty = {

                faculty_id: faculty.faculty_id,

                name: faculty.name,

                email: faculty.email,

                department: faculty.department,

                subject: faculty.subject

            };

            console.log(
                "✅ Faculty Login Successful"
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

            res.redirect(
                "/dashboard/faculty-dashboard.html"
            );

        }
    );

});


// =====================================================
// FACULTY INFORMATION
// =====================================================

router.get("/info", (req, res) => {

    if (!req.session.faculty) {

        return res.status(401).json({

            success: false,

            message:
                "Faculty login required"

        });

    }

    res.json({

        success: true,

        faculty:
            req.session.faculty

    });

});


// =====================================================
// FACULTY FEEDBACK
// =====================================================

router.get("/feedback", (req, res) => {

    console.log(
        "========== FACULTY FEEDBACK REQUEST =========="
    );

    // -------------------------------------------------
    // CHECK FACULTY SESSION
    // -------------------------------------------------

    if (!req.session.faculty) {

        console.log(
            "❌ No faculty session found"
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


    // -------------------------------------------------
    // GET FEEDBACK
    // -------------------------------------------------

    const sql = `

        SELECT

            feedback_id,
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
                    "❌ Faculty Feedback Database Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load feedback",

                    error:
                        err.message

                });

            }


            console.log(
                "✅ Feedback records found:",
                result.length
            );


            // -------------------------------------------------
            // CALCULATE ANALYTICS
            // -------------------------------------------------

            let teachingTotal = 0;

            let communicationTotal = 0;

            let behaviourTotal = 0;


            const teachStars =
                [0, 0, 0, 0, 0];

            const commStars =
                [0, 0, 0, 0, 0];

            const behaveStars =
                [0, 0, 0, 0, 0];


            result.forEach(item => {

                const teaching =
                    Number(item.teaching) || 0;

                const communication =
                    Number(item.communication) || 0;

                const behaviour =
                    Number(item.behaviour) || 0;


                teachingTotal +=
                    teaching;

                communicationTotal +=
                    communication;

                behaviourTotal +=
                    behaviour;


                // Teaching stars
                if (
                    teaching >= 1 &&
                    teaching <= 5
                ) {

                    teachStars[
                        teaching - 1
                    ]++;

                }


                // Communication stars
                if (
                    communication >= 1 &&
                    communication <= 5
                ) {

                    commStars[
                        communication - 1
                    ]++;

                }


                // Behaviour stars
                if (
                    behaviour >= 1 &&
                    behaviour <= 5
                ) {

                    behaveStars[
                        behaviour - 1
                    ]++;

                }

            });


            // -------------------------------------------------
            // TOTAL RESPONSES
            // -------------------------------------------------

            const total =
                result.length;


            // -------------------------------------------------
            // AVERAGES
            // -------------------------------------------------

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


            // -------------------------------------------------
            // OVERALL
            // -------------------------------------------------

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


            // -------------------------------------------------
            // DEBUG
            // -------------------------------------------------

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


            // -------------------------------------------------
            // SEND RESPONSE
            // -------------------------------------------------

            return res.json({

                success: true,

                total,

                responses: total,

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

                teachAverage,

                commAverage,

                behaveAverage,

                overall,

                teachStars,

                commStars,

                behaveStars,

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
                "❌ Faculty Logout Error:",
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
            "✅ Faculty logged out successfully"
        );

        res.redirect(
            "/auth/faculty.html"
        );

    });

});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;