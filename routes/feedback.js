const express = require("express");
const router = express.Router();
const db = require("../db");

// =====================================================
// GET ACTIVE FEEDBACK CYCLE
// =====================================================

async function getActiveCycle() {
    const result = await db.query(`
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

    // Exactly ONE active cycle must exist.
    if (result.rows.length !== 1) {
        return null;
    }

    return result.rows[0];
}

// =====================================================
// GET FACULTY
// =====================================================
//
// Used by the student feedback page.
//
// Returns faculty_id, name, department and subject.
// =====================================================

router.get("/faculty", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                faculty_id,
                name,
                department,
                subject
            FROM faculty
            ORDER BY name ASC
        `);

        return res.json({
            success: true,
            faculty: result.rows,
        });
    } catch (err) {
        console.error("❌ Failed to load faculty:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to load faculty",
        });
    }
});

// =====================================================
// GET FEEDBACK STATUS
// =====================================================
//
// IMPORTANT:
//
// The new feedback table is anonymous and does NOT contain
// student_id.
//
// Therefore participation/status is read from:
// feedback_submissions
//
// This tells the student what they have submitted without
// connecting their identity to the actual feedback response.
// =====================================================

router.get("/status", async (req, res) => {
    if (!req.session || !req.session.student) {
        return res.status(200).json({
            success: false,
            message: "Not Logged In",
        });
    }

    const studentId = req.session.student.student_id;

    try {
        const result = await db.query(
            `
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
            WHERE fs.student_id = $1
            ORDER BY fs.submitted_at DESC
            `,
            [studentId]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            history: result.rows,
        });
    } catch (err) {
        console.error(
            "❌ Failed to load feedback status:",
            err
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load feedback status",
        });
    }
});

// =====================================================
// SUBJECT CODE HELPERS
// =====================================================

function getSubjectCodeFromFacultySubject(subject) {
    const value = String(subject || "").trim();

    if (!value) {
        return "";
    }

    // Example:
    // Data Structures and Algorithms(DSA)
    // -> DSA

    const match = value.match(/\(([^)]+)\)\s*$/);

    if (match) {
        return match[1]
            .trim()
            .toUpperCase();
    }

    // Subjects without (...) need explicit mapping.
    const normalized = value
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const aliases = {
        "web development": "WEB",

        "basic of computer networking": "BCN",
        "basics of computer networking": "BCN",

        "digital electronics and logic design": "DELD",

        "data structures and algorithms": "DSA",

        "object-oriented programming": "OOP",
        "object oriented programming": "OOP",
    };

    return aliases[normalized] || value.toUpperCase();
}

// =====================================================
// SUBMIT ALL FEEDBACK
// =====================================================
//
// One student submits once per active cycle.
//
// Feedback itself remains ANONYMOUS.
//
// student_id is stored ONLY in feedback_submissions.
//
// The backend decides:
// - active cycle
// - faculty
// - subject
// - form type
//
// Frontend cannot control cycle_id or form_type.
// =====================================================

router.post("/submit-all", async (req, res) => {
    console.log("========== SUBMIT ALL FEEDBACK ==========");

    // =================================================
    // CHECK STUDENT LOGIN
    // =================================================

    if (!req.session || !req.session.student) {
        return res.status(401).json({
            success: false,
            message: "Student login required",
        });
    }

    const studentId = req.session.student.student_id;
    const feedback = req.body?.feedback;

    // =================================================
    // CHECK FEEDBACK DATA
    // =================================================

    if (!feedback || typeof feedback !== "object") {
        return res.status(400).json({
            success: false,
            message: "No feedback data received",
        });
    }

    const subjects = Object.values(feedback);

    if (subjects.length === 0) {
        return res.status(400).json({
            success: false,
            message:
                "Please submit feedback for at least one subject",
        });
    }

    // =================================================
    // GET ACTIVE CYCLE
    // =================================================

    const activeCycle = await getActiveCycle();

    if (!activeCycle) {
        return res.status(409).json({
            success: false,
            code: "NO_ACTIVE_CYCLE",
            message:
                "No feedback cycle is currently active",
        });
    }

    // IMPORTANT:
    // cycle_id comes ONLY from the backend.
    const cycleId = activeCycle.id;

    // =================================================
    // DATABASE TRANSACTION
    // =================================================

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // =================================================
        // CHECK IF STUDENT ALREADY SUBMITTED THIS CYCLE
        // =================================================

        const existingSql = `
            SELECT id
            FROM feedback_submissions
            WHERE student_id = $1
              AND cycle_id = $2
            LIMIT 1
        `;

        const existingResult = await client.query(
            existingSql,
            [studentId, cycleId]
        );

        if (existingResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "ALREADY_SUBMITTED",
                message:
                    "You have already submitted feedback for this cycle.",
            });
        }

        // =================================================
        // PROCESS EACH SUBJECT
        // =================================================

        for (const item of subjects) {
            const subjectCode = String(
                item.subject || ""
            )
                .trim()
                .toUpperCase();

            const facultyId = String(
                item.faculty_id || ""
            ).trim();

            const answers =
                item.answers &&
                typeof item.answers === "object" &&
                !Array.isArray(item.answers)
                    ? item.answers
                    : {};

            // =============================================
            // BASIC VALIDATION
            // =============================================

            if (!subjectCode || !facultyId) {
                throw new Error(
                    "Subject and faculty are required for every feedback form."
                );
            }

            // =============================================
            // VERIFY FACULTY
            // =============================================

            const facultySql = `
                SELECT
                    faculty_id,
                    name,
                    department,
                    subject
                FROM faculty
                WHERE faculty_id = $1
                LIMIT 1
            `;

            const facultyResult = await client.query(
                facultySql,
                [facultyId]
            );

            if (facultyResult.rows.length === 0) {
                throw new Error(
                    `Faculty not found for ${subjectCode}`
                );
            }

            const faculty = facultyResult.rows[0];

            // =============================================
            // VERIFY FACULTY + SUBJECT
            // =============================================

            const facultySubject = String(
                faculty.subject || ""
            ).trim();

            const facultySubjectCode =
                getSubjectCodeFromFacultySubject(
                    facultySubject
                );

            const subjectMatches =
                facultySubjectCode === subjectCode ||
                facultySubject.toUpperCase() === subjectCode;

            if (!subjectMatches) {
                throw new Error(
                    `Faculty and subject do not match for ${subjectCode}`
                );
            }

            // =============================================
            // GET SUBJECT REQUIREMENT
            // =============================================

            const requirementSql = `
                SELECT
                    requirement
                FROM subject_requirements
                WHERE LOWER(TRIM(subject)) =
                      LOWER(TRIM($1))
                LIMIT 1
            `;

            const requirementResult =
                await client.query(
                    requirementSql,
                    [facultySubject]
                );

            if (requirementResult.rows.length === 0) {
                throw new Error(
                    `No feedback requirement configured for ${facultySubject}`
                );
            }

            const requirement =
                requirementResult.rows[0].requirement;

            // =============================================
            // DETERMINE FORM TYPE
            // =============================================

            let formType;

            if (requirement === "theory") {
                formType = "theory";
            } else if (requirement === "combined") {
                formType = "combined";
            } else if (requirement === "other") {
                throw new Error(
                    `Subject "${facultySubject}" uses requirement "other", but the feedback table does not support this form type yet.`
                );
            } else {
                throw new Error(
                    `Invalid feedback requirement for ${facultySubject}`
                );
            }

            // =============================================
            // VALIDATE ANSWERS
            // =============================================

            if (
                !answers ||
                typeof answers !== "object" ||
                Array.isArray(answers) ||
                Object.keys(answers).length === 0
            ) {
                throw new Error(
                    `${subjectCode}: No answers received`
                );
            }

            // =============================================
            // CLEAN ANSWERS
            // =============================================

            const cleanedAnswers = {};

            for (const [key, value] of Object.entries(
                answers
            )) {
                if (
                    value === null ||
                    value === undefined
                ) {
                    continue;
                }

                if (typeof value === "string") {
                    const trimmedValue =
                        value.trim();

                    if (trimmedValue !== "") {
                        cleanedAnswers[key] =
                            trimmedValue;
                    }
                } else {
                    cleanedAnswers[key] = value;
                }
            }

            if (
                Object.keys(cleanedAnswers).length === 0
            ) {
                throw new Error(
                    `${subjectCode}: No valid answers received`
                );
            }

            // =============================================
            // INSERT ANONYMOUS FEEDBACK
            // =============================================

            /*
             * IMPORTANT:
             *
             * student_id is NEVER stored in feedback.
             *
             * responses contains the complete answers.
             */

            const feedbackSql = `
                INSERT INTO feedback (
                    faculty_id,
                    department,
                    subject,
                    form_type,
                    responses,
                    cycle_id
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5::jsonb,
                    $6
                )
            `;

            await client.query(
                feedbackSql,
                [
                    facultyId,
                    faculty.department,
                    subjectCode,
                    formType,
                    JSON.stringify(
                        cleanedAnswers
                    ),
                    cycleId,
                ]
            );

            // =============================================
            // PARTICIPATION TRACKING
            // =============================================

            /*
             * Student identity exists ONLY here.
             *
             * This allows the system to know that the
             * student has participated without connecting
             * the student to the anonymous feedback response.
             */

            const trackingSql = `
                INSERT INTO feedback_submissions (
                    student_id,
                    faculty_id,
                    subject,
                    cycle_id
                )
                VALUES ($1, $2, $3, $4)
            `;

            await client.query(
                trackingSql,
                [
                    studentId,
                    facultyId,
                    subjectCode,
                    cycleId,
                ]
            );
        }

        // =================================================
        // COMMIT
        // =================================================

        await client.query("COMMIT");

        console.log(
            "✅ All feedback submitted successfully."
        );

        console.log("Student:", studentId);
        console.log("Cycle:", cycleId);
        console.log(
            "Subjects:",
            subjects.length
        );

        return res.json({
            success: true,
            message:
                "All feedback submitted successfully",
            cycle: {
                id: activeCycle.id,
                name: activeCycle.name,
            },
            redirect:
                "/dashboard/student-dashboard.html?feedback=success",
        });

    } catch (err) {
        await client.query("ROLLBACK");

        console.error(
            "❌ Submit All Feedback Error:",
            err
        );

        // =================================================
        // DUPLICATE SUBMISSION
        // =================================================

        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                code: "DUPLICATE_SUBMISSION",
                message:
                    "Feedback has already been submitted for this cycle.",
            });
        }

        // =================================================
        // DATABASE ERROR
        // =================================================

        return res.status(500).json({
            success: false,
            message:
                err.message ||
                "Failed to submit feedback",
        });

    } finally {
        client.release();
    }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;