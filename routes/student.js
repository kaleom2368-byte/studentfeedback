const express = require("express");
const router = express.Router();

const db = require("../db");

// ===============================
// STUDENT LOGIN
// ===============================
router.post("/login", (req, res) => {

    console.log("========== LOGIN ROUTE HIT ==========");
    console.log("Request Body:", req.body);

    const student_id = req.body.student_id;
    const password = req.body.password;
    const department = req.body.department;

    const sql = `
        SELECT *
        FROM students
        WHERE student_id = ?
        AND password = ?
    `;

    db.query(sql, [student_id, password], (err, result) => {

        if (err) {

            console.error("Database Error:", err);

            return res.status(500).send("Database Error");

        }

        // Invalid Roll Number / Password
        if (result.length === 0) {

            console.log("❌ Invalid Roll Number or Password");

            return res.redirect(
                "/auth/student.html?error=" +
                encodeURIComponent("Invalid Roll Number or Password")
            );

        }

        const student = result[0];

        console.log("Database Department:", student.department);
        console.log("Selected Department:", department);

        // Department Check
        if (
            student.department.trim().toLowerCase() !==
            department.trim().toLowerCase()
        ) {

            console.log("❌ Wrong Department Selected");

            return res.redirect(
                "/auth/student.html?error=" +
                encodeURIComponent("Please select your correct department")
            );

        }

        // Create Session
        req.session.student = {

            student_id: student.student_id,
            name: student.name,
            email: student.email,
            department: student.department,
            year: student.year,
            division: student.division

        };

        console.log("✅ Login Success:", student.name);

        res.redirect("/dashboard/student-dashboard.html");

    });

});

// ===============================
// STUDENT INFO
// ===============================
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

// ===============================
// LOGOUT
// ===============================
router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/auth/student.html");

    });

});

module.exports = router;