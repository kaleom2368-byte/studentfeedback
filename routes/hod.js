const express = require("express");
const router = express.Router();
const db = require("../db");

/*
====================================================
HOD DASHBOARD STATISTICS
GET /hod/dashboard
====================================================
*/

router.get("/dashboard", async (req, res) => {

    try {

        // Total Feedback
        const [totalFeedback] = await db.query(`
            SELECT COUNT(*) AS total
            FROM feedback
        `);

        // Department Average Rating
        const [averageRating] = await db.query(`
            SELECT
            ROUND(AVG((teaching + communication + behaviour) / 3),2)
            AS average
            FROM feedback
        `);

        // Best Faculty
        const [bestFaculty] = await db.query(`
            SELECT
                faculty.name,
                faculty.faculty_id,
                ROUND(AVG((feedback.teaching + feedback.communication + feedback.behaviour)/3),2) AS rating
            FROM faculty
            JOIN feedback
                ON faculty.faculty_id = feedback.faculty_id
            GROUP BY faculty.faculty_id, faculty.name
            ORDER BY rating DESC
            LIMIT 1
        `);

        // Lowest Faculty
        const [lowestFaculty] = await db.query(`
            SELECT
                faculty.name,
                faculty.faculty_id,
                ROUND(AVG((feedback.teaching + feedback.communication + feedback.behaviour)/3),2) AS rating
            FROM faculty
            JOIN feedback
                ON faculty.faculty_id = feedback.faculty_id
            GROUP BY faculty.faculty_id, faculty.name
            ORDER BY rating ASC
            LIMIT 1
        `);

        // Faculty List
        const [facultyList] = await db.query(`
            SELECT
                faculty_id,
                name
            FROM faculty
            ORDER BY name ASC
        `);

        res.json({

            totalFeedback:
                totalFeedback[0].total,

            averageRating:
                averageRating[0].average || 0,

            bestFaculty:
                bestFaculty.length
                    ? bestFaculty[0]
                    : null,

            lowestFaculty:
                lowestFaculty.length
                    ? lowestFaculty[0]
                    : null,

            facultyList

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: "Unable to load dashboard."

        });

    }

});

module.exports = router;