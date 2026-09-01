const express = require("express");
const router = express.Router();

const db = require("../db");


// =====================================================
// GET FACULTY + SUBJECT LIST
// =====================================================
//
// The frontend uses this endpoint to populate:
//   Faculty dropdown
//   Subject dropdown
//
// Faculty and Subject are linked so selecting one can
// automatically select the other.
//
// NOTE:
// This currently assumes `subject` exists in the
// `faculty` table.
//
// If your database has a separate subjects/courses table,
// we will change this query after checking the schema.
// =====================================================

router.get("/faculty", (req, res) => {

    const sql = `
        SELECT
            faculty_id,
            name,
            department,
            subject
        FROM faculty
        ORDER BY name ASC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.error(
                "❌ Faculty Fetch Error:",
                err
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to load faculty"

            });

        }


        return res.json({

            success: true,

            faculty: result

        });

    });

});


// =====================================================
// SUBMIT FEEDBACK
// =====================================================

router.post("/submit", (req, res) => {

    console.log(
        "========== FEEDBACK SUBMISSION =========="
    );


    // =================================================
    // CHECK STUDENT SESSION
    // =================================================

    if (
        !req.session ||
        !req.session.student
    ) {

        console.log(
            "❌ Student session missing"
        );

        return res.status(401).json({

            success: false,

            message:
                "Student login required"

        });

    }


    const studentId =
        req.session.student.student_id;


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


    console.log(
        "Student ID:",
        studentId
    );

    console.log(
        "Faculty ID:",
        faculty_id
    );

    console.log(
        "Department:",
        department
    );

    console.log(
        "Subject:",
        subject
    );


    // =================================================
    // REQUIRED FIELD VALIDATION
    // =================================================

    const missingFields = [];


    if (
        !faculty_id ||
        !String(faculty_id).trim()
    ) {

        missingFields.push(
            "faculty_id"
        );

    }


    if (
        !department ||
        !String(department).trim()
    ) {

        missingFields.push(
            "department"
        );

    }


    if (
        !subject ||
        !String(subject).trim()
    ) {

        missingFields.push(
            "subject"
        );

    }


    if (
        !course_satisfaction ||
        !String(course_satisfaction).trim()
    ) {

        missingFields.push(
            "course_satisfaction"
        );

    }


    if (
        !syllabus_pace ||
        !String(syllabus_pace).trim()
    ) {

        missingFields.push(
            "syllabus_pace"
        );

    }


    if (
        !concept_clarity ||
        !String(concept_clarity).trim()
    ) {

        missingFields.push(
            "concept_clarity"
        );

    }


    if (
        !practical_work ||
        !String(practical_work).trim()
    ) {

        missingFields.push(
            "practical_work"
        );

    }


    if (
        !study_material ||
        !String(study_material).trim()
    ) {

        missingFields.push(
            "study_material"
        );

    }


    if (
        !exam_difficulty ||
        !String(exam_difficulty).trim()
    ) {

        missingFields.push(
            "exam_difficulty"
        );

    }


    if (
        !faculty_support ||
        !String(faculty_support).trim()
    ) {

        missingFields.push(
            "faculty_support"
        );

    }


    if (
        !improvement ||
        !String(improvement).trim()
    ) {

        missingFields.push(
            "improvement"
        );

    }


    if (missingFields.length > 0) {

        console.log(
            "❌ Missing fields:",
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


    // =================================================
    // VERIFY FACULTY
    // =================================================

    const facultySql = `

        SELECT
            faculty_id,
            name,
            department,
            subject

        FROM faculty

        WHERE faculty_id = ?

        LIMIT 1

    `;


    db.query(
        facultySql,
        [faculty_id],
        (facultyError, facultyRows) => {

            if (facultyError) {

                console.error(
                    "❌ Faculty Verification Error:",
                    facultyError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to verify faculty"

                });

            }


            if (
                !facultyRows ||
                facultyRows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Selected faculty member was not found"

                });

            }


            const faculty =
                facultyRows[0];


            // =================================================
            // VERIFY DEPARTMENT
            // =================================================

            if (
                String(faculty.department)
                    .trim()
                    .toLowerCase() !==
                String(department)
                    .trim()
                    .toLowerCase()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Faculty and department information do not match"

                });

            }


            // =================================================
            // VERIFY SUBJECT
            // =================================================
            //
            // Prevent the frontend from submitting an arbitrary
            // faculty + subject combination.
            //
            // If `faculty.subject` is NULL or your database
            // uses another structure, this section should be
            // updated after inspecting the schema.
            // =================================================

            if (
                faculty.subject &&
                String(faculty.subject)
                    .trim()
                    .toLowerCase() !==
                String(subject)
                    .trim()
                    .toLowerCase()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Faculty and subject information do not match"

                });

            }


            // =================================================
            // FIND ACTIVE FEEDBACK CYCLE
            // =================================================

            const activeCycleSql = `

                SELECT
                    id,
                    name,
                    start_date,
                    end_date,
                    status

                FROM feedback_cycles

                WHERE status = 'active'

                ORDER BY id ASC

            `;


            db.query(
                activeCycleSql,
                (cycleError, activeCycles) => {

                    if (cycleError) {

                        console.error(
                            "❌ Active Cycle Lookup Error:",
                            cycleError
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Unable to verify the feedback cycle"

                        });

                    }


                    // =================================================
                    // NO ACTIVE CYCLE
                    // =================================================

                    if (
                        activeCycles.length === 0
                    ) {

                        return res.status(409).json({

                            success: false,

                            code:
                                "NO_ACTIVE_CYCLE",

                            message:
                                "Feedback submission is currently unavailable because no feedback cycle is active."

                        });

                    }


                    // =================================================
                    // MULTIPLE ACTIVE CYCLES
                    // =================================================

                    if (
                        activeCycles.length !== 1
                    ) {

                        console.error(
                            "❌ INVALID CYCLE CONFIGURATION: Multiple active cycles found."
                        );

                        return res.status(409).json({

                            success: false,

                            code:
                                "MULTIPLE_ACTIVE_CYCLES",

                            message:
                                "Feedback submission is currently unavailable because the feedback-cycle configuration is invalid."

                        });

                    }


                    const activeCycle =
                        activeCycles[0];

                    const cycleId =
                        activeCycle.id;


                    console.log(
                        "✅ Active Cycle:",
                        activeCycle.name,
                        "ID:",
                        cycleId
                    );


                    // =================================================
                    // BEGIN DATABASE TRANSACTION
                    // =================================================

                    db.getConnection(
                        (connectionError, connection) => {

                            if (connectionError) {

                                console.error(
                                    "❌ Database Connection Error:",
                                    connectionError
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Failed to submit feedback"

                                });

                            }


                            const rollback =
                                (error) => {

                                    connection.rollback(
                                        () => {

                                            connection.release();

                                            console.error(
                                                "❌ Feedback transaction rolled back:",
                                                error
                                            );

                                            return res.status(500).json({

                                                success: false,

                                                message:
                                                    "Failed to submit feedback"

                                            });

                                        }
                                    );

                                };


                            connection.beginTransaction(
                                (transactionError) => {

                                    if (transactionError) {

                                        connection.release();

                                        console.error(
                                            "❌ Transaction Start Error:",
                                            transactionError
                                        );

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Failed to submit feedback"

                                        });

                                    }


                                    // =================================================
                                    // CONVERT CURRENT RATINGS
                                    // =================================================

                                    const teaching =
                                        course_satisfaction === "Excellent"
                                            ? 5
                                            : course_satisfaction === "Good"
                                                ? 4
                                                : course_satisfaction === "Average"
                                                    ? 3
                                                    : course_satisfaction === "Poor"
                                                        ? 2
                                                        : 3;


                                    const communication =
                                        concept_clarity === "Very Clear"
                                            ? 5
                                            : concept_clarity === "Mostly Clear"
                                                ? 4
                                                : concept_clarity === "Rarely Clear"
                                                    ? 2
                                                    : 3;


                                    const behaviour =
                                        faculty_support === "Always Available"
                                            ? 5
                                            : faculty_support === "Sometimes Available"
                                                ? 4
                                                : faculty_support === "Rarely Available"
                                                    ? 3
                                                    : 3;


                                    // =================================================
                                    // INSERT ANONYMOUS FEEDBACK
                                    // =================================================

                                    const feedbackSql = `

                                        INSERT INTO feedback (

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

                                            cycle_id

                                        )

                                        VALUES (
                                            ?, ?, ?, ?, ?, ?,
                                            ?, ?, ?, ?, ?, ?,
                                            ?, ?, ?, ?
                                        )

                                    `;


                                    const feedbackValues = [

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
                                        comments || null,

                                        cycleId

                                    ];


                                    connection.query(
                                        feedbackSql,
                                        feedbackValues,
                                        (feedbackError) => {

                                            if (feedbackError) {

                                                return rollback(
                                                    feedbackError
                                                );

                                            }


                                            // =================================================
                                            // INSERT PARTICIPATION TRACKING
                                            // =================================================
                                            //
                                            // Student identity is stored ONLY in
                                            // feedback_submissions for participation
                                            // tracking.
                                            //
                                            // It is NOT stored in feedback.
                                            // =================================================

                                            const trackingSql = `

                                                INSERT INTO feedback_submissions (

                                                    student_id,
                                                    faculty_id,
                                                    subject,
                                                    cycle_id

                                                )

                                                VALUES (?, ?, ?, ?)

                                            `;


                                            const trackingValues = [

                                                studentId,
                                                faculty_id,
                                                subject,
                                                cycleId

                                            ];


                                            connection.query(
                                                trackingSql,
                                                trackingValues,
                                                (trackingError) => {

                                                    if (trackingError) {

                                                        // =================================================
                                                        // DATABASE UNIQUE CONSTRAINT
                                                        // =================================================

                                                        if (
                                                            trackingError.code ===
                                                            "ER_DUP_ENTRY"
                                                        ) {

                                                            return connection.rollback(
                                                                () => {

                                                                    connection.release();

                                                                    console.log(
                                                                        "⚠️ Duplicate feedback prevented by database constraint."
                                                                    );

                                                                    return res.status(409).json({

                                                                        success: false,

                                                                        code:
                                                                            "DUPLICATE_SUBMISSION",

                                                                        message:
                                                                            "You have already submitted feedback for this faculty member in the active cycle."

                                                                    });

                                                                }
                                                            );

                                                        }


                                                        return rollback(
                                                            trackingError
                                                        );

                                                    }


                                                    // =================================================
                                                    // COMMIT
                                                    // =================================================

                                                    connection.commit(
                                                        (commitError) => {

                                                            if (commitError) {

                                                                return rollback(
                                                                    commitError
                                                                );

                                                            }


                                                            connection.release();


                                                            console.log(
                                                                "✅ Anonymous feedback saved successfully."
                                                            );

                                                            console.log(
                                                                "✅ Participation tracking saved."
                                                            );

                                                            console.log(
                                                                "Cycle ID:",
                                                                cycleId
                                                            );


                                                            return res.json({

                                                                success: true,

                                                                message:
                                                                    "Feedback submitted successfully",

                                                                cycle: {

                                                                    id:
                                                                        activeCycle.id,

                                                                    name:
                                                                        activeCycle.name

                                                                },

                                                                redirect:
                                                                    "/dashboard/student-dashboard.html?feedback=success"

                                                            });

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// FEEDBACK HISTORY
// =====================================================

router.get("/history", (req, res) => {

    if (
        !req.session ||
        !req.session.student
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Student login required"

        });

    }


    const studentId =
        req.session.student.student_id;


    const sql = `

        SELECT

            fs.id,

            fs.faculty_id,

            fs.subject,

            fs.cycle_id,

            fs.submitted_at,

            fc.name AS cycle_name,

            f.name AS faculty_name

        FROM feedback_submissions fs

        LEFT JOIN faculty f
            ON fs.faculty_id = f.faculty_id

        LEFT JOIN feedback_cycles fc
            ON fs.cycle_id = fc.id

        WHERE fs.student_id = ?

        ORDER BY
            fs.submitted_at DESC

    `;


    db.query(
        sql,
        [studentId],
        (err, result) => {

            if (err) {

                console.error(
                    "❌ Feedback History Error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load feedback history"

                });

            }


            return res.json({

                success: true,

                feedback: result

            });

        }
    );

});


// =====================================================
// FEEDBACK STATUS
// =====================================================

router.get("/status", (req, res) => {

    if (
        !req.session ||
        !req.session.student
    ) {

        return res.json({

            success: false,

            message:
                "Not Logged In"

        });

    }


    const studentId =
        req.session.student.student_id;


    // =================================================
    // GET ACTIVE CYCLE
    // =================================================

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
                    "❌ Status Cycle Error:",
                    cycleError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load feedback status"

                });

            }


            // =================================================
            // NO ACTIVE CYCLE
            // =================================================

            if (
                cycles.length === 0
            ) {

                return res.json({

                    success: true,

                    activeCycle: null,

                    count: 0,

                    history: []

                });

            }


            // =================================================
            // INVALID CONFIGURATION
            // =================================================

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


            // =================================================
            // GET STUDENT'S SUBMISSIONS
            // IN ACTIVE CYCLE
            // =================================================

            const statusSql = `

                SELECT

                    fs.id,

                    fs.faculty_id,

                    fs.subject,

                    fs.cycle_id,

                    fs.submitted_at,

                    f.name AS faculty_name

                FROM feedback_submissions fs

                LEFT JOIN faculty f
                    ON fs.faculty_id = f.faculty_id

                WHERE fs.student_id = ?

                AND fs.cycle_id = ?

                ORDER BY
                    fs.submitted_at DESC

            `;


            db.query(
                statusSql,
                [
                    studentId,
                    activeCycle.id
                ],
                (err, result) => {

                    if (err) {

                        console.error(
                            "❌ Status Query Error:",
                            err
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to load feedback status"

                        });

                    }


                    return res.json({

                        success: true,

                        activeCycle: {

                            id:
                                activeCycle.id,

                            name:
                                activeCycle.name,

                            start_date:
                                activeCycle.start_date,

                            end_date:
                                activeCycle.end_date

                        },

                        count:
                            result.length,

                        history:
                            result

                    });

                }
            );

        }
    );

});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;