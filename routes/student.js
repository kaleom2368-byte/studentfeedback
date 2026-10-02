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

        req.session.mustChangePassword = !!student.must_change_password;

        req.session.save((sessionError) => {
            if (sessionError) {
                console.error("❌ Session Save Error:", sessionError);
                return res.status(500).send("Session Error");
            }
            if (student.must_change_password) {
                return res.redirect('/change-password/student.html');
            }
            return res.redirect("/dashboard/student-dashboard.html");
        });

    } catch (err) {
        console.error("❌ Student Login Database Error:", err);
        return res.status(500).send("Database Error");
    }
});

// =====================================================
// CHANGE PASSWORD
// =====================================================

router.post("/change-password", async (req, res) => {
    if (!req.session || !req.session.student) return res.redirect('/auth/student.html');
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword !== confirmPassword)
        return res.redirect('/change-password/student.html?error=Passwords+do+not+match');
    if (newPassword.length < 6)
        return res.redirect('/change-password/student.html?error=Password+must+be+at+least+6+characters');
    try {
        await db.query(
            'UPDATE students SET password=$1, must_change_password=FALSE WHERE student_id=$2',
            [newPassword, req.session.student.student_id]
        );
        req.session.mustChangePassword = false;
        return req.session.save(() => res.redirect('/dashboard/student-dashboard.html'));
    } catch (err) {
        console.error('Change password error:', err);
        return res.redirect('/change-password/student.html?error=Failed+to+change+password');
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