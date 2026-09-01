const express = require("express");
const router = express.Router();

const db = require("../db");

// =====================================================
// FACULTY LOGIN
// =====================================================

router.post("/login", (req, res) => {
    const {
        faculty_id,
        department,
        password
    } = req.body;

    console.log("========== FACULTY LOGIN ==========");

    console.log("Faculty ID:", faculty_id);
    console.log("Department:", department);

    if (!faculty_id || !department || !password) {
        return res.redirect(
            "/auth/faculty.html?error=" +
            encodeURIComponent(
                "Please enter Faculty ID, Department and Password"
            )
        );
    }

    const sql = `
        SELECT
            faculty_id,
            name,
            email,
            password,
            department,
            subject
        FROM faculty
        WHERE faculty_id = ?
        AND LOWER(TRIM(department)) = LOWER(TRIM(?))
        AND password = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [
            faculty_id,
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

            if (!result || result.length === 0) {
                console.log("❌ Invalid Faculty Login");

                return res.redirect(
                    "/auth/faculty.html?error=" +
                    encodeURIComponent(
                        "Invalid Faculty ID, Department or Password"
                    )
                );
            }

            const faculty = result[0];

            req.session.faculty = {
                faculty_id: faculty.faculty_id,
                name: faculty.name,
                email: faculty.email,
                department: faculty.department,
                subject: faculty.subject || ""
            };

            console.log("✅ Faculty Login Successful");
            console.log("Faculty ID:", faculty.faculty_id);
            console.log("Name:", faculty.name);
            console.log("Department:", faculty.department);
            console.log("Subject:", faculty.subject);

            req.session.save((sessionError) => {
                if (sessionError) {
                    console.error(
                        "❌ Faculty Session Save Error:",
                        sessionError
                    );

                    return res
                        .status(500)
                        .send("Session Error");
                }

                console.log("✅ Faculty session saved");

                return res.redirect(
                    "/dashboard/faculty-dashboard.html"
                );
            });
        }
    );
});


// =====================================================
// FACULTY INFO
// GET /faculty/info
// =====================================================

router.get("/info", (req, res) => {
    console.log("========== FACULTY INFO ==========");

    if (
        !req.session ||
        !req.session.faculty
    ) {
        console.log("❌ No faculty session found");

        return res
            .status(401)
            .json({
                success: false,
                message: "Faculty not logged in"
            });
    }

    const facultyId =
        req.session.faculty.faculty_id;

    const sql = `
        SELECT
            faculty_id,
            name,
            email,
            department,
            subject
        FROM faculty
        WHERE faculty_id = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [facultyId],
        (err, result) => {
            if (err) {
                console.error(
                    "❌ Faculty Info Database Error:",
                    err
                );

                return res
                    .status(500)
                    .json({
                        success: false,
                        message: "Database Error"
                    });
            }

            if (
                !result ||
                result.length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message: "Faculty not found"
                    });
            }

            const faculty = result[0];

            const subjects = [];

            if (
                faculty.subject &&
                String(faculty.subject).trim()
            ) {
                subjects.push(
                    String(faculty.subject).trim()
                );
            }

            req.session.faculty = {
                faculty_id: faculty.faculty_id,
                name: faculty.name,
                email: faculty.email,
                department: faculty.department,
                subject: faculty.subject || ""
            };

            return res.json({
                success: true,

                faculty: {
                    faculty_id: faculty.faculty_id,
                    name: faculty.name,
                    email: faculty.email,
                    department: faculty.department,
                    subjects: subjects
                }
            });
        }
    );
});


// =====================================================
// FACULTY FEEDBACK
// GET /faculty/feedback
//
// IMPORTANT DESIGN
//
// 1. feedback table:
//    Anonymous feedback only.
//
// 2. feedback_submissions table:
//    Participation tracking only.
//
// Student identity is NEVER included inside the
// anonymous feedback response.
//
// Student ID and submission time are NEVER sent
// to the faculty dashboard.
//
// The participation response contains only:
//
//    name
//    status
//
// =====================================================

router.get("/feedback", (req, res) => {
    console.log("========== FACULTY FEEDBACK ==========");

    // =================================================
    // CHECK SESSION
    // =================================================

    if (
        !req.session ||
        !req.session.faculty
    ) {
        console.log("❌ No faculty session found");

        return res
            .status(401)
            .json({
                success: false,
                message: "Faculty not logged in"
            });
    }

    const facultyId =
        req.session.faculty.faculty_id;

    const facultyDepartment =
        req.session.faculty.department || "";

    console.log(
        "Loading feedback for:",
        facultyId
    );

    // =================================================
    // FIND ACTIVE CYCLE
    //
    // We require exactly ONE active cycle.
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
        ORDER BY id DESC
    `;

    db.query(
        activeCycleSql,
        (activeCycleError, activeCycles) => {
            if (activeCycleError) {
                console.error(
                    "❌ Active Cycle Lookup Error:",
                    activeCycleError
                );

                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "Unable to load the feedback cycle"
                    });
            }

            // =================================================
            // NO ACTIVE CYCLE
            // =================================================

            if (
                !activeCycles ||
                activeCycles.length === 0
            ) {
                console.log(
                    "ℹ️ No active feedback cycle"
                );

                return res.json({
                    success: true,

                    no_active_cycle: true,

                    message:
                        "No feedback cycle is currently active.",

                    activeCycle: null,

                    feedback: [],

                    total: 0,

                    feedbackCount: 0,

                    ratings: {
                        course_satisfaction: 0,
                        syllabus_pace: 0,
                        concept_clarity: 0,
                        practical_work: 0,
                        study_material: 0,
                        exam_difficulty: 0,
                        faculty_support: 0,
                        improvement: 0
                    },

                    averages: {
                        course_satisfaction: 0,
                        syllabus_pace: 0,
                        concept_clarity: 0,
                        practical_work: 0,
                        study_material: 0,
                        exam_difficulty: 0,
                        faculty_support: 0,
                        improvement: 0
                    },

                    statistics: {},
                    stats: {},
                    summary: {},

                    overall: 0,
                    overallRating: 0,
                    overallAverage: 0,
                    averageRating: 0,

                    currentCycle: null,
                    cycleResponses: 0,

                    months: [],
                    monthlyTrend: [],
                    cycles: [],
                    history: [],

                    participation: {
                        totalStudents: 0,
                        submittedCurrent: 0,
                        pendingCurrent: 0,
                        submitted: 0,
                        currentResponses: 0,

                        students: []
                    }
                });
            }

            // =================================================
            // SAFETY:
            // EXACTLY ONE ACTIVE CYCLE
            // =================================================

            if (activeCycles.length > 1) {
                console.error(
                    "❌ Multiple active feedback cycles detected:",
                    activeCycles.map(cycle => cycle.id)
                );

                return res
                    .status(409)
                    .json({
                        success: false,
                        message:
                            "Multiple active feedback cycles detected. Please keep exactly one cycle active."
                    });
            }

            const activeCycle =
                activeCycles[0];

            console.log(
                "Active Cycle:",
                activeCycle.name,
                "| ID:",
                activeCycle.id
            );

            // =================================================
            // GET ANONYMOUS FEEDBACK
            //
            // IMPORTANT:
            // student_id is NOT selected.
            // student name is NOT selected.
            //
            // This response can NEVER tell the dashboard
            // which student gave which feedback.
            // =================================================

            const feedbackSql = `
                SELECT
                    id,
                    faculty_id,
                    subject,
                    department,

                    course_satisfaction,
                    syllabus_pace,
                    concept_clarity,
                    practical_work,
                    study_material,
                    exam_difficulty,
                    faculty_support,
                    improvement,

                    comments

                FROM feedback

                WHERE faculty_id = ?
                AND cycle_id = ?

                ORDER BY id DESC
            `;

            db.query(
                feedbackSql,
                [
                    facultyId,
                    activeCycle.id
                ],
                (feedbackError, feedbackRows) => {
                    if (feedbackError) {
                        console.error(
                            "❌ Faculty Feedback Database Error:",
                            feedbackError
                        );

                        return res
                            .status(500)
                            .json({
                                success: false,
                                message:
                                    "Database Error"
                            });
                    }

                    const feedback =
                        Array.isArray(feedbackRows)
                            ? feedbackRows
                            : [];

                    // =================================================
                    // 8 FEEDBACK PARAMETERS
                    // =================================================

                    const parameters = [
                        "course_satisfaction",
                        "syllabus_pace",
                        "concept_clarity",
                        "practical_work",
                        "study_material",
                        "exam_difficulty",
                        "faculty_support",
                        "improvement"
                    ];

                    const totals = {};
                    const counts = {};

                    parameters.forEach(parameter => {
                        totals[parameter] = 0;
                        counts[parameter] = 0;
                    });

                    // =================================================
                    // CALCULATE AVERAGES
                    // =================================================
                    // =================================================
// CONVERT CATEGORICAL ANSWERS TO NUMERIC SCORES
// =================================================

const scoreMaps = {

    course_satisfaction: {
        "Excellent": 5,
        "Good": 4,
        "Average": 3,
        "Poor": 2,
        "Very Poor": 1
    },

    syllabus_pace: {
        "Just Right": 5,
        "Too Slow": 2,
        "Too Fast": 2
    },

    concept_clarity: {
        "Very Clear": 5,
        "Mostly Clear": 4,
        "Somewhat Clear": 3,
        "Not Clear": 2
    },

    practical_work: {
        "Highly Effective": 5,
        "Effective": 4,
        "Somewhat Effective": 3,
        "Not Effective": 2
    },

    study_material: {
        "Very Helpful": 5,
        "Helpful": 4,
        "Somewhat Helpful": 3,
        "Not Helpful": 2
    },

    exam_difficulty: {
        "Challenging but Fair": 5,
        "Moderate": 4,
        "Too Easy": 2,
        "Too Difficult": 2
    },

    faculty_support: {
        "Always Available": 5,
        "Usually Available": 4,
        "Sometimes Available": 3,
        "Rarely Available": 2,
        "Never Available": 1
    }

};

// =================================================
// CALCULATE NUMERIC AVERAGES
// =================================================

feedback.forEach(item => {

    parameters.forEach(parameter => {

        // "improvement" is a suggestion field,
        // not a 1–5 rating field.
        if (parameter === "improvement") {
            return;
        }

        const rawValue =
            item[parameter];

        if (
            rawValue === null ||
            rawValue === undefined
        ) {
            return;
        }

        const textValue =
            String(rawValue).trim();

        // First try categorical mapping
        let value =
            scoreMaps[parameter]?.[textValue];

        // Fallback for any future numeric value
        if (value === undefined) {
            const numericValue =
                Number(rawValue);

            if (
                Number.isFinite(numericValue) &&
                numericValue > 0
            ) {
                value = numericValue;
            }
        }

        if (
            Number.isFinite(value) &&
            value > 0 &&
            value <= 5
        ) {
            totals[parameter] += value;
            counts[parameter]++;
        }

    });

});
                   

                    const averages = {};

                    parameters.forEach(parameter => {
                        averages[parameter] =
                            counts[parameter] > 0
                                ? Number(
                                    (
                                        totals[parameter] /
                                        counts[parameter]
                                    ).toFixed(1)
                                )
                                : 0;
                    });

                    // =================================================
                    // OVERALL AVERAGE
                    // =================================================

                    const validAverages =
                        Object.values(averages)
                            .filter(value => value > 0);

                    const overall =
                        validAverages.length > 0
                            ? Number(
                                (
                                    validAverages.reduce(
                                        (sum, value) =>
                                            sum + value,
                                        0
                                    ) /
                                    validAverages.length
                                ).toFixed(1)
                            )
                            : 0;

                    // =================================================
                    // CURRENT CYCLE SUMMARY
                    // =================================================

                    const currentCycleSummary = {
                        key:
                            String(activeCycle.id),

                        cycle_id:
                            activeCycle.id,

                        label:
                            activeCycle.name,

                        name:
                            activeCycle.name,

                        start_date:
                            activeCycle.start_date,

                        end_date:
                            activeCycle.end_date,

                        status:
                            "current",

                        count:
                            feedback.length,

                        responses:
                            feedback.length,

                        feedbackCount:
                            feedback.length,

                        overall:
                            overall,

                        overallRating:
                            overall,

                        overallAverage:
                            overall,

                        average:
                            overall
                    };

                    parameters.forEach(parameter => {
                        currentCycleSummary[parameter] =
                            averages[parameter];
                    });

                    // =================================================
                    // TOTAL STUDENTS
                    //
                    // We get the student names from students.
                    //
                    // Student ID is used internally in SQL only.
                    // It is NEVER returned to the frontend.
                    //
                    // Submission time is NOT selected.
                    // =================================================

                    const participationSql = `
                        SELECT
                            s.student_id,
                            s.name,

                            CASE
                                WHEN EXISTS (
                                    SELECT 1
                                    FROM feedback_submissions fs
                                    WHERE fs.student_id = s.student_id
                                    AND fs.faculty_id = ?
                                    AND fs.cycle_id = ?
                                )
                                THEN 'Submitted'
                                ELSE 'Pending'
                            END AS submission_status

                        FROM students s

                        WHERE LOWER(TRIM(s.department)) =
                              LOWER(TRIM(?))

                        ORDER BY s.name ASC
                    `;

                    db.query(
                        participationSql,
                        [
                            facultyId,
                            activeCycle.id,
                            facultyDepartment
                        ],
                        (participationError, participationRows) => {
                            if (participationError) {
                                console.error(
                                    "❌ Participation Query Error:",
                                    participationError
                                );

                                return res
                                    .status(500)
                                    .json({
                                        success: false,
                                        message:
                                            "Unable to calculate feedback participation"
                                    });
                            }

                            const rows =
                                Array.isArray(participationRows)
                                    ? participationRows
                                    : [];

                            // =================================================
                            // IMPORTANT PRIVACY BOUNDARY
                            //
                            // We intentionally create a NEW object here.
                            //
                            // student_id is NOT copied.
                            //
                            // Only:
                            //
                            //    name
                            //    status
                            //
                            // are exposed.
                            // =================================================

                            const participationStudents =
                                rows.map(student => ({
                                    name:
                                        student.name || "Unnamed Student",

                                    status:
                                        student.submission_status ===
                                        "Submitted"
                                            ? "Submitted"
                                            : "Pending"
                                }));

                            // =================================================
                            // PARTICIPATION COUNTS
                            // =================================================

                            const totalStudents =
                                participationStudents.length;

                            const submittedCurrent =
                                participationStudents.filter(
                                    student =>
                                        student.status ===
                                        "Submitted"
                                ).length;

                            const pendingCurrent =
                                participationStudents.filter(
                                    student =>
                                        student.status ===
                                        "Pending"
                                ).length;

                            const participation = {
                                totalStudents:
                                    totalStudents,

                                submittedCurrent:
                                    submittedCurrent,

                                pendingCurrent:
                                    pendingCurrent,

                                submitted:
                                    submittedCurrent,

                                currentResponses:
                                    submittedCurrent,

                                // ONLY NAME + STATUS
                                //
                                // No student_id.
                                // No submitted_at.
                                // No feedback.
                                students:
                                    participationStudents
                            };

                            // =================================================
                            // CYCLE DATA
                            // =================================================

                            const months = [
                                currentCycleSummary
                            ];

                            // =================================================
                            // LOGGING
                            // =================================================

                            console.log(
                                "✅ Feedback loaded:",
                                feedback.length
                            );

                            console.log(
                                "Overall:",
                                overall
                            );

                            console.log(
                                "8 Parameter Averages:",
                                averages
                            );

                            console.log(
                                "Participation:",
                                submittedCurrent,
                                "/",
                                totalStudents
                            );

                            console.log(
                                "Pending:",
                                pendingCurrent
                            );

                            console.log(
                                "=================================="
                            );

                            // =================================================
                            // FINAL RESPONSE
                            //
                            // NOTICE:
                            //
                            // feedback[] contains anonymous feedback.
                            //
                            // participation.students[] contains ONLY:
                            //
                            //    name
                            //    status
                            //
                            // They are separate structures.
                            // =================================================

                            return res.json({
                                success: true,

                                no_active_cycle:
                                    false,

                                // -----------------------------------------
                                // ACTIVE CYCLE
                                // -----------------------------------------

                                activeCycle:
                                    activeCycle,

                                // -----------------------------------------
                                // ANONYMOUS FEEDBACK
                                // -----------------------------------------

                                feedback:
                                    feedback,

                                total:
                                    feedback.length,

                                feedbackCount:
                                    feedback.length,

                                // -----------------------------------------
                                // 8 PARAMETERS
                                // -----------------------------------------

                                ratings:
                                    averages,

                                averages:
                                    averages,

                                statistics:
                                    averages,

                                stats:
                                    averages,

                                summary:
                                    averages,

                                // -----------------------------------------
                                // OVERALL
                                // -----------------------------------------

                                overall:
                                    overall,

                                overallRating:
                                    overall,

                                overallAverage:
                                    overall,

                                averageRating:
                                    overall,

                                // -----------------------------------------
                                // CURRENT CYCLE
                                // -----------------------------------------

                                currentCycle: {
                                    id:
                                        activeCycle.id,

                                    cycle_id:
                                        activeCycle.id,

                                    name:
                                        activeCycle.name,

                                    label:
                                        activeCycle.name,

                                    responses:
                                        feedback.length,

                                    count:
                                        feedback.length,

                                    feedbackCount:
                                        feedback.length,

                                    overall:
                                        overall
                                },

                                cycleResponses:
                                    feedback.length,

                                // -----------------------------------------
                                // CYCLES / HISTORY
                                // -----------------------------------------

                                months:
                                    months,

                                monthlyTrend:
                                    months,

                                cycles:
                                    months,

                                history:
                                    months,

                                // -----------------------------------------
                                // PARTICIPATION
                                //
                                // NAME + STATUS ONLY
                                // -----------------------------------------

                                participation:
                                    participation
                            });
                        }
                    );
                }
            );
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

    if (!req.session) {
        return res.redirect(
            "/auth/faculty.html"
        );
    }

    req.session.destroy((err) => {
        if (err) {
            console.error(
                "Faculty logout error:",
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

        return res.redirect(
            "/auth/faculty.html"
        );
    });
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;