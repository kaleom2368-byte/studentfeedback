const express = require("express");
const crypto = require("crypto");

const router = express.Router();
const db = require("../db");
const requireAdmin = require("../middleware/require-admin");

// =====================================================
// PASSWORD VERIFICATION
// =====================================================

function verifyPassword(password, storedHash) {

    return new Promise((resolve, reject) => {

        try {

            const parts = String(storedHash).split("$");

            if (
                parts.length !== 6 ||
                parts[0] !== "scrypt"
            ) {
                return resolve(false);
            }

            const N = Number(parts[1]);
            const r = Number(parts[2]);
            const p = Number(parts[3]);
            const salt = parts[4];
            const expectedHash = parts[5];

            if (
                !Number.isInteger(N) ||
                !Number.isInteger(r) ||
                !Number.isInteger(p) ||
                !salt ||
                !expectedHash
            ) {
                return resolve(false);
            }

            crypto.scrypt(
                password,
                salt,
                64,
                {
                    N,
                    r,
                    p,
                    maxmem: 64 * 1024 * 1024
                },
                (error, derivedKey) => {

                    if (error) {
                        return reject(error);
                    }

                    const actualHash =
                        derivedKey.toString("base64");

                    const actualBuffer =
                        Buffer.from(actualHash, "utf8");

                    const expectedBuffer =
                        Buffer.from(expectedHash, "utf8");

                    if (
                        actualBuffer.length !==
                        expectedBuffer.length
                    ) {
                        return resolve(false);
                    }

                    return resolve(
                        crypto.timingSafeEqual(
                            actualBuffer,
                            expectedBuffer
                        )
                    );

                }
            );

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

    const adminid =
        typeof req.body.adminid === "string"
            ? req.body.adminid.trim()
            : "";

    const password =
        typeof req.body.password === "string"
            ? req.body.password
            : "";

    console.log("========== ADMIN LOGIN ==========");
    console.log("Admin ID:", adminid);

    // -------------------------------------------------
    // CHECK REQUIRED FIELDS
    // -------------------------------------------------

    if (!adminid || !password) {

        return res.redirect(
            "/auth/adminfile.html?error=" +
            encodeURIComponent(
                "Please enter Admin ID and Password"
            )
        );

    }

    // -------------------------------------------------
    // FIND ADMIN
    // -------------------------------------------------

    const sql = `
        SELECT
            id,
            username,
            password
        FROM admin
        WHERE username = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [adminid],
        async (err, result) => {

            if (err) {

                console.error(
                    "❌ Admin Login Database Error:",
                    err
                );

                return res.status(500).send(
                    "Database Error"
                );

            }

            // -------------------------------------------------
            // INVALID USERNAME
            // -------------------------------------------------

            if (
                !result ||
                result.length === 0
            ) {

                console.log(
                    "❌ Invalid Admin Login"
                );

                return res.redirect(
                    "/auth/adminfile.html?error=" +
                    encodeURIComponent(
                        "Invalid Admin ID or Password"
                    )
                );

            }

            const admin = result[0];

            // -------------------------------------------------
            // VERIFY PASSWORD
            // -------------------------------------------------

            try {

                const validPassword =
                    await verifyPassword(
                        password,
                        admin.password
                    );

                if (!validPassword) {

                    console.log(
                        "❌ Invalid Admin Password"
                    );

                    return res.redirect(
                        "/auth/adminfile.html?error=" +
                        encodeURIComponent(
                            "Invalid Admin ID or Password"
                        )
                    );

                }

            } catch (passwordError) {

                console.error(
                    "❌ Admin Password Verification Error:",
                    passwordError
                );

                return res.status(500).send(
                    "Authentication Error"
                );

            }

            // -------------------------------------------------
            // REGENERATE SESSION
            // -------------------------------------------------

            req.session.regenerate(
                (sessionError) => {

                    if (sessionError) {

                        console.error(
                            "❌ Admin Session Regeneration Error:",
                            sessionError
                        );

                        return res.status(500).send(
                            "Session Error"
                        );

                    }

                    // -------------------------------------------------
                    // CREATE ADMIN SESSION
                    // -------------------------------------------------

                    req.session.admin = {

                        admin_id:
                            admin.id,

                        username:
                            admin.username,

                        role:
                            "admin"

                    };

                    console.log(
                        "✅ Admin Login Successful"
                    );

                    console.log(
                        "Admin ID:",
                        admin.username
                    );

                    console.log(
                        "=================================="
                    );

                    // -------------------------------------------------
                    // SAVE SESSION
                    // -------------------------------------------------

                    req.session.save(
                        (saveError) => {

                            if (saveError) {

                                console.error(
                                    "❌ Admin Session Save Error:",
                                    saveError
                                );

                                return res.status(500).send(
                                    "Session Error"
                                );

                            }

                            console.log(
                                "✅ Admin session saved"
                            );

                            return res.redirect(
                                "/dashboard/admin-dashboard.html"
                            );

                        }
                    );

                }
            );

        }
    );

});


// =====================================================
// ADMIN LOGOUT
// GET /admin/logout
// =====================================================

router.get(
    "/logout",
    requireAdmin,
    (req, res) => {

        console.log(
            "========== ADMIN LOGOUT =========="
        );

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "❌ Admin Logout Error:",
                        error
                    );

                    return res.status(500).send(
                        "Logout Error"
                    );

                }

                res.clearCookie("connect.sid");

                console.log(
                    "✅ Admin session destroyed"
                );

                return res.redirect(
                    "/auth/adminfile.html"
                );

            }
        );

    }
);


// =====================================================
// ADMIN INFORMATION
// GET /admin/info
// =====================================================

router.get(
    "/info",
    requireAdmin,
    (req, res) => {

        return res.json({

            success: true,

            admin: {
                admin_id:
                    req.session.admin.admin_id,

                username:
                    req.session.admin.username,

                role:
                    req.session.admin.role
            }

        });

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;