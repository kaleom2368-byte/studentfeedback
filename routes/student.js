const express = require("express");
const router = express.Router();

const db = require("../db");

// =====================================================
// STUDENT LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    console.log("========== LOGIN ROUTE HIT ==========");
    console.log("Request Body:", req.body);

    const {
        student_id,
        password,
        department
    } = req.body || {};

    // -------------------------------------------------
    // CHECK REQUIRED FIELDS
    // -------------------------------------------------

    if (!student_id || !password || !department) {

        return res.redirect(
            "/auth/student.html?error=" +
            encodeURIComponent(
                "Please enter all login details"
            )
        );

    }

    try {

        // -------------------------------------------------
        // FIND STUDENT
        // -------------------------------------------------

        const sql = `
            SELECT *
            FROM students
            WHERE student_id = $1
            AND password = $2
        `;

        const result = await db.query(
            sql,
            [student_id, password]
        );

        // -------------------------------------------------
        // INVALID LOGIN
        // -------------------------------------------------

        if (result.rows.length === 0) {

            console.log(
                "❌ Invalid Roll Number or Password"
            );

            return res.redirect(
                "/auth/student.html?error=" +
                encodeURIComponent(
                    "Invalid Roll Number or Password"
                )
            );

        }

        const student = result.rows[0];

        // -------------------------------------------------
        // DEPARTMENT CHECK
        // -------------------------------------------------

        console.log(
            "Database Department:",
            student.department
        );

        console.log(
            "Selected Department:",
            department
        );

        if (
            String(student.department || "")
                .trim()
                .toLowerCase() !==
            String(department || "")
                .trim()
                .toLowerCase()
        ) {

            console.log(
                "❌ Wrong Department Selected"
            );

            return res.redirect(
                "/auth/student.html?error=" +
                encodeURIComponent(
                    "Please select your correct department"
                )
            );

        }

        // -------------------------------------------------
        // CREATE STUDENT SESSION
        // -------------------------------------------------

        req.session.student = {

            student_id: student.student_id,

            name: student.name,

            email: student.email,

            department: student.department,

            year: student.year,

            division: student.division

        };

        console.log(
            "✅ Login Success:",
            student.name
        );

        // -------------------------------------------------
        // SAVE SESSION BEFORE REDIRECT
        // -------------------------------------------------

        req.session.save((sessionError) => {

            if (sessionError) {

                console.error(
                    "❌ Session Save Error:",
                    sessionError
                );

                return res.status(500).send(
                    "Session Error"
                );

            }

            console.log(
                "✅ Student session saved"
            );

            // -------------------------------------------------
            // GO TO DASHBOARD
            // -------------------------------------------------

            return res.redirect(
                "/dashboard/student-dashboard.html"
            );

        });

    } catch (err) {

        console.error(
            "❌ Student Login Database Error:",
            err
        );

        return res.status(500).send(
            "Database Error"
        );

    }

});

// =====================================================
// STUDENT INFORMATION
// =====================================================

router.get("/student-info", (req, res) => {

    if (!req.session.student) {

        return res.json({

            logged: false

        });

    }

    res.json({

        logged: true,

        student: req.session.student

    });

});

// =====================================================
// STUDENT LOGOUT
// =====================================================

router.get("/logout", (req, res) => {

    console.log(
        "========== STUDENT LOGOUT =========="
    );

    req.session.destroy((err) => {

        if (err) {

            console.error(
                "❌ Logout Error:",
                err
            );

            return res.status(500).json({

                success: false,

                message: "Logout failed"

            });

        }

        // -------------------------------------------------
        // REMOVE SESSION COOKIE
        // -------------------------------------------------

        res.clearCookie("connect.sid");

        console.log(
            "✅ Student logged out successfully"
        );

        // -------------------------------------------------
        // REDIRECT TO LOGIN
        // -------------------------------------------------

        res.redirect(
            "/auth/student.html"
        );

    });

});

module.exports = router;