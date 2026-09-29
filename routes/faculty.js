"use strict";

const express = require("express");
const router = express.Router();
const db = require("../db");

const PARAMETERS = [
    "course_satisfaction",
    "syllabus_pace",
    "concept_clarity",
    "practical_work",
    "study_material",
    "exam_difficulty",
    "faculty_support",
    "improvement"
];

const SCORE_MAPS = {
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

/* =========================================================
   HELPERS
========================================================= */

function facultyLoggedIn(req) {
    return !!req.session?.faculty?.faculty_id;
}

function facultyId(req) {
    return req.session.faculty.faculty_id;
}

function emptyAverages() {
    return Object.fromEntries(
        PARAMETERS.map(key => [key, 0])
    );
}

function normalizeFeedback(rows) {
    return rows.map(row => {
        let responses = row.responses;

        if (typeof responses === "string") {
            try {
                responses = JSON.parse(responses);
            } catch {
                responses = {};
            }
        }

        if (!responses || typeof responses !== "object") {
            responses = {};
        }

        return {
            id: row.id,
            faculty_id: row.faculty_id,
            subject: row.subject,
            department: row.department,
            cycle_id: row.cycle_id,

            course_satisfaction:
                responses.course_satisfaction ?? null,

            syllabus_pace:
                responses.syllabus_pace ?? null,

            concept_clarity:
                responses.concept_clarity ?? null,

            practical_work:
                responses.practical_work ?? null,

            study_material:
                responses.study_material ?? null,

            exam_difficulty:
                responses.exam_difficulty ?? null,

            faculty_support:
                responses.faculty_support ?? null,

            improvement:
                responses.improvement ?? null,

            comments:
                responses.comments ??
                responses.comment ??
                null
        };
    });
}

function calculateAverages(feedback) {
    const totals = {};
    const counts = {};

    PARAMETERS.forEach(key => {
        totals[key] = 0;
        counts[key] = 0;
    });

    for (const item of feedback) {
        for (const key of PARAMETERS) {
            if (key === "improvement") continue;

            const raw = item[key];

            if (raw === null || raw === undefined || raw === "") {
                continue;
            }

            let score = SCORE_MAPS[key]?.[String(raw).trim()];

            if (score === undefined) {
                const numeric = Number(raw);

                if (
                    Number.isFinite(numeric) &&
                    numeric >= 1 &&
                    numeric <= 5
                ) {
                    score = numeric;
                }
            }

            if (score >= 1 && score <= 5) {
                totals[key] += score;
                counts[key]++;
            }
        }
    }

    const averages = emptyAverages();

    for (const key of PARAMETERS) {
        if (counts[key]) {
            averages[key] = Number(
                (totals[key] / counts[key]).toFixed(1)
            );
        }
    }

    const ratings = PARAMETERS
        .filter(key => key !== "improvement")
        .map(key => averages[key])
        .filter(value => value > 0);

    const overall = ratings.length
        ? Number(
            (
                ratings.reduce(
                    (sum, value) => sum + value,
                    0
                ) / ratings.length
            ).toFixed(1)
        )
        : 0;

    return { averages, overall };
}

function cycleSummary(cycle, feedback) {
    const { averages, overall } =
        calculateAverages(feedback);

    return {
        id: cycle.id,
        cycle_id: cycle.id,
        name: cycle.name,
        label: cycle.name,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        status: cycle.status,

        count: feedback.length,
        responses: feedback.length,
        feedbackCount: feedback.length,

        overall,
        overallRating: overall,
        overallAverage: overall,
        averageRating: overall,

        ...averages
    };
}

/* =========================================================
   LOGIN
========================================================= */

router.post("/login", async (req, res) => {
    try {
        const {
            faculty_id,
            department,
            password
        } = req.body || {};

        if (!faculty_id || !department || !password) {
            return res.redirect(
                "/auth/faculty.html?error=" +
                encodeURIComponent(
                    "Please enter Faculty ID, Department and Password"
                )
            );
        }

        const result = await db.query(
            `
            SELECT
                faculty_id,
                name,
                email,
                password,
                department,
                subject
            FROM faculty
            WHERE faculty_id = $1
              AND LOWER(TRIM(department)) =
                  LOWER(TRIM($2))
              AND password = $3
            LIMIT 1
            `,
            [faculty_id, department, password]
        );

        if (!result.rows.length) {
            return res.redirect(
                "/auth/faculty.html?error=" +
                encodeURIComponent(
                    "Invalid Faculty ID, Department or Password"
                )
            );
        }

        const faculty = result.rows[0];

        req.session.faculty = {
            faculty_id: faculty.faculty_id,
            name: faculty.name,
            email: faculty.email,
            department: faculty.department,
            subject: faculty.subject || ""
        };

        req.session.save(error => {
            if (error) {
                console.error("Faculty session error:", error);
                return res.status(500).send("Session Error");
            }

            res.redirect(
                "/dashboard/faculty-dashboard.html"
            );
        });

    } catch (error) {
        console.error("Faculty login error:", error);
        res.status(500).send("Database Error");
    }
});

/* =========================================================
   INFO
========================================================= */

router.get("/info", async (req, res) => {
    if (!facultyLoggedIn(req)) {
        return res.status(401).json({
            success: false,
            message: "Faculty not logged in"
        });
    }

    try {
        const result = await db.query(
            `
            SELECT
                faculty_id,
                name,
                email,
                department,
                subject
            FROM faculty
            WHERE faculty_id = $1
            LIMIT 1
            `,
            [facultyId(req)]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Faculty not found"
            });
        }

        const faculty = result.rows[0];

        req.session.faculty = {
            faculty_id: faculty.faculty_id,
            name: faculty.name,
            email: faculty.email,
            department: faculty.department,
            subject: faculty.subject || ""
        };

        res.json({
            success: true,
            faculty: {
                ...req.session.faculty,
                subjects: faculty.subject
                    ? [String(faculty.subject).trim()]
                    : []
            }
        });

    } catch (error) {
        console.error("Faculty info error:", error);

        res.status(500).json({
            success: false,
            message: "Database Error"
        });
    }
});

/* =========================================================
   FEEDBACK
========================================================= */

router.get("/feedback", async (req, res) => {
    if (!facultyLoggedIn(req)) {
        return res.status(401).json({
            success: false,
            message: "Faculty not logged in"
        });
    }

    try {
        const id = facultyId(req);

        /* -------------------------------------------------
           ACTIVE CYCLE
        ------------------------------------------------- */

        const activeResult = await db.query(`
            SELECT
                id,
                name,
                start_date,
                end_date,
                status
            FROM feedback_cycles
            WHERE status = 'active'
            ORDER BY id DESC
        `);

        if (activeResult.rows.length === 0) {
            return res.json({
                success: true,
                no_active_cycle: true,
                activeCycle: null,
                currentCycle: null,
                feedback: [],
                total: 0,
                feedbackCount: 0,
                cycleResponses: 0,
                ratings: emptyAverages(),
                averages: emptyAverages(),
                statistics: emptyAverages(),
                stats: emptyAverages(),
                summary: emptyAverages(),
                overall: 0,
                overallRating: 0,
                overallAverage: 0,
                averageRating: 0,
                cycles: [],
                history: [],
                months: [],
                monthlyTrend: [],
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

        if (activeResult.rows.length > 1) {
            return res.status(409).json({
                success: false,
                message:
                    "Multiple active feedback cycles detected."
            });
        }

        const activeCycle = activeResult.rows[0];

        /* -------------------------------------------------
           CURRENT ANONYMOUS FEEDBACK
        ------------------------------------------------- */

        const feedbackResult = await db.query(
            `
            SELECT
                id,
                faculty_id,
                subject,
                department,
                responses,
                cycle_id
            FROM feedback
            WHERE faculty_id = $1
              AND cycle_id = $2
            ORDER BY id DESC
            `,
            [id, activeCycle.id]
        );

        const feedback =
            normalizeFeedback(
                feedbackResult.rows
            );

        const {
            averages,
            overall
        } = calculateAverages(feedback);

        /* -------------------------------------------------
           HISTORY
        ------------------------------------------------- */

        const cyclesResult = await db.query(`
            SELECT
                id,
                name,
                start_date,
                end_date,
                status
            FROM feedback_cycles
            ORDER BY id DESC
        `);

        const history = [];

        for (const cycle of cyclesResult.rows) {
            const result = await db.query(
                `
                SELECT
                    id,
                    faculty_id,
                    subject,
                    department,
                    responses,
                    cycle_id
                FROM feedback
                WHERE faculty_id = $1
                  AND cycle_id = $2
                `,
                [id, cycle.id]
            );

            history.push(
                cycleSummary(
                    cycle,
                    normalizeFeedback(result.rows)
                )
            );
        }

        /* -------------------------------------------------
           PARTICIPATION
           
           IMPORTANT FIX:
           Do NOT compare faculty.department with
           student.department.

           faculty_divisions already defines which
           divisions belong to this faculty.
        ------------------------------------------------- */

        const participationResult = await db.query(
            `
            SELECT
                s.student_id,
                s.name,

                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM feedback_submissions fs
                        WHERE fs.student_id = s.student_id
                          AND fs.faculty_id = $1
                          AND fs.cycle_id = $2
                    )
                    THEN 'Submitted'
                    ELSE 'Pending'
                END AS submission_status

            FROM students s

            WHERE EXISTS (
                SELECT 1
                FROM faculty_divisions fd
                WHERE fd.faculty_id = $1
                  AND LOWER(TRIM(fd.division)) =
                      LOWER(TRIM(s.division))
            )

            ORDER BY s.name ASC
            `,
            [id, activeCycle.id]
        );

        const students =
            participationResult.rows.map(student => ({
                name: student.name || "Unnamed Student",
                status:
                    student.submission_status === "Submitted"
                        ? "Submitted"
                        : "Pending"
            }));

        const totalStudents =
            students.length;

        const submittedCurrent =
            students.filter(
                student =>
                    student.status === "Submitted"
            ).length;

        const pendingCurrent =
            totalStudents - submittedCurrent;

        /* -------------------------------------------------
           RESPONSE
        ------------------------------------------------- */

        const currentCycle = {
            id: activeCycle.id,
            cycle_id: activeCycle.id,
            name: activeCycle.name,
            label: activeCycle.name,
            start_date: activeCycle.start_date,
            end_date: activeCycle.end_date,
            status: activeCycle.status,
            count: feedback.length,
            responses: feedback.length,
            feedbackCount: feedback.length,
            overall,
            overallRating: overall,
            overallAverage: overall,
            averageRating: overall,
            ...averages
        };

        res.json({
            success: true,
            no_active_cycle: false,

            activeCycle,
            currentCycle,

            feedback,

            total: feedback.length,
            feedbackCount: feedback.length,
            cycleResponses: feedback.length,

            ratings: averages,
            averages,
            statistics: averages,
            stats: averages,
            summary: averages,

            overall,
            overallRating: overall,
            overallAverage: overall,
            averageRating: overall,

            cycles: history,
            history,
            months: history,
            monthlyTrend: history,

            participation: {
                totalStudents,
                submittedCurrent,
                pendingCurrent,
                submitted: submittedCurrent,
                currentResponses: submittedCurrent,
                students
            }
        });

    } catch (error) {
        console.error("Faculty feedback error:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load faculty feedback"
        });
    }
});

/* =========================================================
   LOGOUT
========================================================= */

function logout(req, res) {
    if (!req.session) {
        return res.redirect("/auth/faculty.html");
    }

    req.session.destroy(error => {
        if (error) {
            console.error("Faculty logout error:", error);
            return res.status(500).send("Logout failed");
        }

        res.clearCookie("connect.sid");
        res.redirect("/auth/faculty.html");
    });
}

router.get("/logout", logout);
router.post("/logout", logout);

module.exports = router;