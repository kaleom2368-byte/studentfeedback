const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================
// STUDENT DASHBOARD STATS
// =====================================
//
// IMPORTANT:
// -----------------------------
// feedback = anonymous feedback
// feedback_submissions = participation tracking
//
// DO NOT query student_id from feedback.
// Student-specific submission information
// must come from feedback_submissions.
// =====================================

router.get("/stats", (req, res) => {

    // =====================================
    // CHECK STUDENT SESSION
    // =====================================

    if (
        !req.session ||
        !req.session.student
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Student not logged in"

        });

    }


    const studentId =
        req.session.student.student_id;


    // =====================================
    // FIND ACTIVE FEEDBACK CYCLE
    // =====================================
    //
    // Backend determines the active cycle.
    // Frontend must never choose cycle_id.
    // =====================================

    const cycleSql = `

        SELECT
            id,
            name,
            start_date,
            end_date

        FROM feedback_cycles

        WHERE status = 'active'

        ORDER BY id ASC

    `;


    db.query(
        cycleSql,
        (cycleError, cycles) => {

            if (cycleError) {

                console.error(
                    "❌ Dashboard Cycle Error:",
                    cycleError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load dashboard"

                });

            }


            // =====================================
            // NO ACTIVE CYCLE
            // =====================================

            if (
                !cycles ||
                cycles.length === 0
            ) {

                return res.json({

                    success: true,

                    feedbackCount: 0,

                    facultyCount: 0

                });

            }


            // =====================================
            // MULTIPLE ACTIVE CYCLES
            // =====================================

            if (
                cycles.length !== 1
            ) {

                console.error(
                    "❌ Multiple active feedback cycles detected."
                );

                return res.status(409).json({

                    success: false,

                    code:
                        "MULTIPLE_ACTIVE_CYCLES",

                    message:
                        "Feedback-cycle configuration is invalid."

                });

            }


            const activeCycle =
                cycles[0];


            const cycleId =
                activeCycle.id;


            // =====================================
            // GET STUDENT PARTICIPATION STATS
            // =====================================
            //
            // Student identity exists only in
            // feedback_submissions.
            //
            // This gives us:
            //
            // feedbackCount =
            // number of faculty feedback submissions
            //
            // facultyCount =
            // number of different faculty members
            // the student submitted feedback for
            //
            // No anonymous feedback is exposed here.
            // =====================================

            const statsSql = `

                SELECT

                    COUNT(*) AS feedbackCount,

                    COUNT(
                        DISTINCT faculty_id
                    ) AS facultyCount

                FROM feedback_submissions

                WHERE student_id = ?

                AND cycle_id = ?

            `;


            db.query(
                statsSql,
                [
                    studentId,
                    cycleId
                ],
                (statsError, result) => {

                    if (statsError) {

                        console.error(
                            "❌ Dashboard Stats Error:",
                            statsError
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to load dashboard statistics"

                        });

                    }


                    const stats =
                        result[0] || {};


                    return res.json({

                        success: true,

                        feedbackCount:
                            Number(
                                stats.feedbackCount || 0
                            ),

                        facultyCount:
                            Number(
                                stats.facultyCount || 0
                            )

                    });

                }
            );

        }
    );

});


// =====================================
// CHECK FACULTY SESSION
// =====================================

router.get(
    "/faculty-session",
    (req, res) => {

        // =====================================
        // NO FACULTY SESSION
        // =====================================

        if (
            !req.session ||
            !req.session.faculty
        ) {

            return res.json({

                logged: false

            });

        }


        // =====================================
        // FACULTY SESSION EXISTS
        // =====================================

        return res.json({

            logged: true,

            faculty:
                req.session.faculty

        });

    }
);


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;