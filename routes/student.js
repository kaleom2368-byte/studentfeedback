const express = require("express");
const router = express.Router();

const db = require("../db");

// =====================================================
// STUDENT LOGIN
// =====================================================

router.post("/login", (req, res) => {

    console.log("========== LOGIN ROUTE HIT ==========");
    console.log("Request Body:", req.body);

    const student_id = req.body.student_id;
    const password = req.body.password;
    const department = req.body.department;

    // -------------------------------------------------
    // CHECK REQUIRED FIELDS
    // -------------------------------------------------

    if (!student_id || !password || !department) {

        return res.redirect(
            "/auth/student.html?error=" +
            encodeURIComponent("Please enter all login details")
        );

    }

    // -------------------------------------------------
    // FIND STUDENT
    // -------------------------------------------------

    const sql = `
        SELECT *
        FROM students
        WHERE student_id = ?
        AND password = ?
    `;

    db.query(sql, [student_id, password], (err, result) => {

        if (err) {

            console.error("❌ Database Error:", err);

            return res.status(500).send("Database Error");

        }

        // -------------------------------------------------
        // INVALID LOGIN
        // -------------------------------------------------

        if (result.length === 0) {

            console.log("❌ Invalid Roll Number or Password");

            return res.redirect(
                "/auth/student.html?error=" +
                encodeURIComponent(
                    "Invalid Roll Number or Password"
                )
            );

        }

        const student = result[0];

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
            student.department.trim().toLowerCase() !==
            department.trim().toLowerCase()
        ) {

            console.log("❌ Wrong Department Selected");

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

            res.redirect(
                "/dashboard/student-dashboard.html"
            );

        });

    });

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

    console.log("========== STUDENT LOGOUT ==========");

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

        res.redirect("/auth/student.html");

    });

});


module.exports = router;