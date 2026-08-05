const express = require("express");
const router = express.Router();

const db = require("../db");

// =======================================
// FACULTY LOGIN
// =======================================

router.post("/login", (req, res) => {

    const {
        faculty_id,
        email,
        department,
        password
    } = req.body;

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

                console.error("Faculty Login Error:", err);

                return res
                    .status(500)
                    .send("Database Error");

            }

            if (result.length === 0) {

                return res.redirect(
                    "/auth/faculty.html?error=" +
                    encodeURIComponent(
                        "Invalid Faculty ID, Email, Department or Password"
                    )
                );

            }

            const faculty = result[0];

            req.session.faculty = {

                faculty_id: faculty.faculty_id,
                name: faculty.name,
                email: faculty.email,
                department: faculty.department,
                subject: faculty.subject

            };

            console.log("LOGIN SESSION CREATED:");
            console.log(req.session.faculty);

            res.redirect("/dashboard/faculty-dashboard.html");

        }

    );

});

// =======================================
// FACULTY INFO
// =======================================

router.get("/info", (req, res) => {

    if (!req.session.faculty) {

        return res.json({
            success: false
        });

    }

    res.json({

        success: true,
        faculty: req.session.faculty

    });

});

// =======================================
// FACULTY FEEDBACK ANALYTICS
// =======================================

router.get("/feedback", (req, res) => {

    console.log("FEEDBACK SESSION:");
    console.log(req.session);

    if (!req.session.faculty) {

        return res.json({
            success: false
        });

    }

    const faculty_id = req.session.faculty.faculty_id;

    const sql = `
        SELECT
            subject,
            teaching,
            communication,
            behaviour,
            comments,
            submitted_at
        FROM feedback
        WHERE faculty_id = ?
        ORDER BY submitted_at DESC
    `;

    db.query(sql, [faculty_id], (err, result) => {

        if (err) {

            console.error("Feedback Error:", err);

            return res.json({
                success: false
            });

        }

        let teaching = 0;
        let communication = 0;
        let behaviour = 0;

        const teachStars = [0, 0, 0, 0, 0];
        const commStars = [0, 0, 0, 0, 0];
        const behaveStars = [0, 0, 0, 0, 0];

        result.forEach(item => {

            const teach = Number(item.teaching);
            const comm = Number(item.communication);
            const behave = Number(item.behaviour);

            teaching += teach;
            communication += comm;
            behaviour += behave;

            if (teach >= 1 && teach <= 5)
                teachStars[teach - 1]++;

            if (comm >= 1 && comm <= 5)
                commStars[comm - 1]++;

            if (behave >= 1 && behave <= 5)
                behaveStars[behave - 1]++;

        });

        const total = result.length;

        const teachAverage = total
            ? Number((teaching / total).toFixed(1))
            : 0;

        const commAverage = total
            ? Number((communication / total).toFixed(1))
            : 0;

        const behaveAverage = total
            ? Number((behaviour / total).toFixed(1))
            : 0;

        // ================= DEBUG =================

        console.log("========== FEEDBACK API RESPONSE ==========");
        console.log({
            total,
            teachAverage,
            commAverage,
            behaveAverage,
            feedback: result
        });
        console.log("===========================================");

        // ==========================================

        res.json({

            success: true,

            total,

            teaching: Math.round(teachAverage),
            communication: Math.round(commAverage),
            behaviour: Math.round(behaveAverage),

            teachAverage,
            commAverage,
            behaveAverage,

            responses: total,

            teachStars,
            commStars,
            behaveStars,

            overall: Number(
                (
                    (
                        teachAverage +
                        commAverage +
                        behaveAverage
                    ) / 3
                ).toFixed(1)
            ),

            feedback: result

        });

    });

});

// =======================================
// FACULTY LOGOUT
// =======================================

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/auth/faculty.html");

    });

});

module.exports = router;