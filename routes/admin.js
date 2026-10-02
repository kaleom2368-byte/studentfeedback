const express = require("express");
const crypto  = require("crypto");
const router  = express.Router();
const db      = require("../db");
const requireAdmin = require("../middleware/require-admin");


// =====================================================
// PASSWORD VERIFICATION (scrypt)
// =====================================================

function verifyPassword(password, storedHash) {
    return new Promise((resolve, reject) => {
        try {
            const parts = String(storedHash).split("$");

            // Plain-text password stored (non-hashed HOD/faculty passwords)
            if (parts.length !== 6 || parts[0] !== "scrypt") {
                // Fallback: treat as plain-text comparison
                return resolve(String(password) === String(storedHash));
            }

            const N    = Number(parts[1]);
            const r    = Number(parts[2]);
            const p    = Number(parts[3]);
            const salt = parts[4];
            const expectedHash = parts[5];

            if (!Number.isInteger(N) || !Number.isInteger(r) ||
                !Number.isInteger(p) || !salt || !expectedHash) {
                return resolve(false);
            }

            crypto.scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => {
                if (error) return reject(error);

                const actualHash    = derivedKey.toString("base64");
                const actualBuffer  = Buffer.from(actualHash,     "utf8");
                const expectBuffer  = Buffer.from(expectedHash,   "utf8");

                if (actualBuffer.length !== expectBuffer.length) return resolve(false);

                return resolve(crypto.timingSafeEqual(actualBuffer, expectBuffer));
            });

        } catch (error) {
            reject(error);
        }
    });
}


// =====================================================
// ADMIN LOGIN
// POST /admin/login
// =====================================================

router.post("/login", async (req, res) => {

    const adminid  = typeof req.body.adminid  === "string" ? req.body.adminid.trim()  : "";
    const password = typeof req.body.password === "string" ? req.body.password        : "";

    console.log("========== ADMIN LOGIN ==========");
    console.log("Admin ID:", adminid);

    if (!adminid || !password) {
        return res.redirect(
            "/auth/adminfile.html?error=" +
            encodeURIComponent("Please enter Admin ID and Password")
        );
    }

    try {

        const result = await db.query(`
            SELECT id, username, password, must_change_password
            FROM admin
            WHERE username = $1
            LIMIT 1
        `, [adminid]);

        if (result.rows.length === 0) {
            console.log("❌ Invalid Admin Login");
            return res.redirect(
                "/auth/adminfile.html?error=" +
                encodeURIComponent("Invalid Admin ID or Password")
            );
        }

        const admin = result.rows[0];

        const validPassword = await verifyPassword(password, admin.password);

        if (!validPassword) {
            console.log("❌ Invalid Admin Password");
            return res.redirect(
                "/auth/adminfile.html?error=" +
                encodeURIComponent("Invalid Admin ID or Password")
            );
        }

        req.session.regenerate((sessionError) => {

            if (sessionError) {
                console.error("❌ Admin Session Regeneration Error:", sessionError);
                return res.status(500).send("Session Error");
            }

            req.session.admin = {
                admin_id: admin.id,
                username: admin.username,
                role:     "admin"
            };

            req.session.mustChangePassword = !!admin.must_change_password;

            console.log("✅ Admin Login Successful:", admin.username);

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("❌ Admin Session Save Error:", saveError);
                    return res.status(500).send("Session Error");
                }
                if (admin.must_change_password) {
                    return res.redirect('/change-password/admin.html');
                }
                return res.redirect("/dashboard/admin-dashboard.html");
            });

        });

    } catch (err) {
        console.error("❌ Admin Login Database Error:", err);
        return res.status(500).send("Database Error");
    }

});


// =====================================================
// ADMIN LOGOUT
// GET /admin/logout
// =====================================================

router.get("/logout", requireAdmin, (req, res) => {

    req.session.destroy((error) => {
        if (error) {
            console.error("❌ Admin Logout Error:", error);
            return res.status(500).send("Logout Error");
        }

        res.clearCookie("connect.sid");
        console.log("✅ Admin session destroyed");
        return res.redirect("/auth/adminfile.html");
    });

});


// =====================================================
// ADMIN INFORMATION
// GET /admin/info
// =====================================================

router.get("/info", requireAdmin, (req, res) => {

    return res.json({
        success: true,
        admin: {
            admin_id: req.session.admin.admin_id,
            username: req.session.admin.username,
            role:     req.session.admin.role
        }
    });

});


// =====================================================
// FEEDBACK CYCLE — LIST ALL
// GET /admin/cycles
// =====================================================

router.get("/cycles", requireAdmin, async (req, res) => {

    try {
        const result = await db.query(`
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            ORDER BY id DESC
        `);

        return res.json({ success: true, cycles: result.rows });

    } catch (err) {
        console.error("❌ Admin Cycles Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load cycles" });
    }

});


// =====================================================
// FEEDBACK CYCLE — CREATE
// POST /admin/cycles/create
// =====================================================

router.post("/cycles/create", requireAdmin, async (req, res) => {

    const { name, start_date, end_date } = req.body;

    if (!name || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: "Name, start date, and end date are required." });
    }

    try {

        const result = await db.query(`
            INSERT INTO feedback_cycles (name, start_date, end_date, status)
            VALUES ($1, $2, $3, 'inactive')
            RETURNING id, name, start_date, end_date, status
        `, [name.trim(), start_date, end_date]);

        const cycle = result.rows[0];

        console.log("✅ Feedback cycle created:", cycle.name);

        return res.json({ success: true, message: "Cycle created successfully.", cycle });

    } catch (err) {
        console.error("❌ Create Cycle Error:", err);
        return res.status(500).json({ success: false, message: "Failed to create cycle: " + err.message });
    }

});


// =====================================================
// FEEDBACK CYCLE — ACTIVATE
// POST /admin/cycles/:id/activate
// =====================================================

router.post("/cycles/:id/activate", requireAdmin, async (req, res) => {

    const cycleId = req.params.id;

    try {

        // Deactivate all others first
        await db.query(`UPDATE feedback_cycles SET status = 'inactive' WHERE status = 'active'`);

        const result = await db.query(`
            UPDATE feedback_cycles
            SET status = 'active'
            WHERE id = $1
            RETURNING id, name, status
        `, [cycleId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Cycle not found." });
        }

        console.log("✅ Cycle activated:", result.rows[0].name);

        return res.json({ success: true, message: "Cycle activated.", cycle: result.rows[0] });

    } catch (err) {
        console.error("❌ Activate Cycle Error:", err);
        return res.status(500).json({ success: false, message: "Failed to activate cycle." });
    }

});


// =====================================================
// FEEDBACK CYCLE — END / DEACTIVATE
// POST /admin/cycles/:id/end
// =====================================================

router.post("/cycles/:id/end", requireAdmin, async (req, res) => {

    const cycleId = req.params.id;

    try {

        const result = await db.query(`
            UPDATE feedback_cycles
            SET status = 'inactive'
            WHERE id = $1
            RETURNING id, name, status
        `, [cycleId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Cycle not found." });
        }

        console.log("✅ Cycle ended:", result.rows[0].name);

        return res.json({ success: true, message: "Cycle ended.", cycle: result.rows[0] });

    } catch (err) {
        console.error("❌ End Cycle Error:", err);
        return res.status(500).json({ success: false, message: "Failed to end cycle." });
    }

});


// =====================================================
// EXPORT
// =====================================================

// POST /admin/change-password
router.post('/change-password', async (req, res) => {
    if (!req.session || !req.session.admin) return res.redirect('/auth/adminfile.html');
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword !== confirmPassword)
        return res.redirect('/change-password/admin.html?error=Passwords+do+not+match');
    if (newPassword.length < 6)
        return res.redirect('/change-password/admin.html?error=Password+must+be+at+least+6+characters');
    try {
        await db.query(
            'UPDATE admin SET password=$1, must_change_password=FALSE WHERE id=$2',
            [newPassword, req.session.admin.admin_id]
        );
        req.session.mustChangePassword = false;
        return req.session.save(() => res.redirect('/dashboard/admin-dashboard.html'));
    } catch (err) {
        console.error('Admin change-password error:', err);
        return res.redirect('/change-password/admin.html?error=Failed+to+change+password');
    }
});

// GET /admin/users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const students = await db.query('SELECT student_id, name, email, department, year, division FROM students ORDER BY student_id ASC');
        const faculty  = await db.query('SELECT faculty_id, name, email, department, subject FROM faculty ORDER BY name ASC');
        const hods     = await db.query('SELECT hod_id, name, email, department FROM hod ORDER BY name ASC');
        return res.json({ success: true, students: students.rows, faculty: faculty.rows, hods: hods.rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load users' });
    }
});

// POST /admin/reset-password
router.post('/reset-password', requireAdmin, async (req, res) => {
    const { role, id, newPassword } = req.body;
    if (!role || !id || !newPassword) return res.status(400).json({ success: false, message: 'role, id, and newPassword required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    try {
        if (role === 'student') {
            await db.query('UPDATE students SET password=$1, must_change_password=FALSE WHERE student_id=$2', [newPassword, id]);
        } else if (role === 'faculty') {
            await db.query('UPDATE faculty SET password=$1, must_change_password=FALSE WHERE faculty_id=$2', [newPassword, id]);
        } else if (role === 'hod') {
            await db.query('UPDATE hod SET password=$1, must_change_password=FALSE WHERE hod_id=$2', [newPassword, id]);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        return res.json({ success: true, message: `Password reset for ${role}: ${id}` });
    } catch (err) {
        console.error('Admin reset password error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

// POST /admin/create-student
router.post('/create-student', requireAdmin, async (req, res) => {
    const { student_id, name, email, department, year, division } = req.body;
    if (!student_id || !name || !email || !department || !year || !division)
        return res.status(400).json({ success: false, message: 'All fields required' });
    try {
        await db.query(
            'INSERT INTO students (student_id, name, email, password, department, year, division, must_change_password) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)',
            [student_id, name, email, 'pass@123', department, year, division]
        );
        return res.json({ success: true, message: 'Student created. Default password: pass@123' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, message: 'Student ID or email already exists' });
        return res.status(500).json({ success: false, message: 'Failed to create student: ' + err.message });
    }
});

// POST /admin/create-faculty
router.post('/create-faculty', requireAdmin, async (req, res) => {
    const { faculty_id, name, email, department, subject } = req.body;
    if (!faculty_id || !name || !email || !department || !subject)
        return res.status(400).json({ success: false, message: 'All fields required' });
    try {
        await db.query(
            'INSERT INTO faculty (faculty_id, name, email, password, department, subject, must_change_password) VALUES ($1,$2,$3,$4,$5,$6,TRUE)',
            [faculty_id, name, email, 'pass@123', department, subject]
        );
        return res.json({ success: true, message: 'Faculty created. Default password: pass@123' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ success: false, message: 'Faculty ID or email already exists' });
        return res.status(500).json({ success: false, message: 'Failed to create faculty: ' + err.message });
    }
});


// =====================================================
// ADMIN DELETION ROUTES
// =====================================================

// DELETE /admin/cycles/:id
router.delete("/cycles/:id", requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM feedback_cycles WHERE id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Cycle deleted successfully' });
    } catch (err) {
        console.error('Delete cycle error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete cycle' });
    }
});

// DELETE /admin/students/:id
router.delete("/students/:id", requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE student_id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err) {
        console.error('Delete student error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
});

// DELETE /admin/faculty/:id
router.delete("/faculty/:id", requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM faculty WHERE faculty_id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Faculty deleted successfully' });
    } catch (err) {
        console.error('Delete faculty error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete faculty' });
    }
});

module.exports = router;