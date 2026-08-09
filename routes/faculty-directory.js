const express = require("express");
const router = express.Router();

const db = require("../db");


// ======================================
// GET FACULTY BY STUDENT DEPARTMENT
// ======================================

router.get("/", (req, res) => {

    // ----------------------------------
    // CHECK STUDENT LOGIN
    // ----------------------------------

    if (!req.session.student) {

        return res.status(401).json({

            success: false,

            message: "Student not logged in"

        });

    }


    // ----------------------------------
    // GET STUDENT DEPARTMENT
    // ----------------------------------

    const department =
        req.session.student.department;


    if (!department) {

        return res.status(400).json({

            success: false,

            message: "Student department not found"

        });

    }


    // ----------------------------------
    // GET FACULTY
    // ----------------------------------

    const sql = `

        SELECT
            faculty_id,
            name,
            email,
            department

        FROM faculty

        WHERE department = ?

        ORDER BY name ASC

    `;


    db.query(sql, [department], (err, result) => {

        if (err) {

            console.error(
                "❌ Faculty Directory Error:",
                err
            );


            return res.status(500).json({

                success: false,

                message: "Database error"

            });

        }


        // ----------------------------------
        // RETURN FACULTY
        // ----------------------------------

        res.json({

            success: true,

            faculty: result

        });

    });

});


module.exports = router;