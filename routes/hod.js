const express = require("express");


const VALUE_TO_SCORE = {
    "Very Satisfied": 5, "Very Appropriate": 5, "Very Clear": 5, "Very Helpful": 5, "Excellent": 5, "Just Right": 5,
    "Satisfied": 4, "Appropriate": 4, "Mostly Clear": 4, "Clear": 4, "Helpful": 4, "Good": 4,
    "Neutral": 3, "Somewhat Clear": 3, "Average": 3,
    "Dissatisfied": 2, "Too Fast": 2, "Not Clear": 2, "Not Helpful": 2, "Difficult": 2, "Needs Improvement": 2, "Poor": 2,
    "Very Dissatisfied": 1, "Too Slow": 1, "Very Difficult": 1, "Very Poor": 1
};

function getFeedbackAverage(responses) {
    if (typeof responses === 'string') {
        try { responses = JSON.parse(responses); } catch (e) { responses = {}; }
    }
    if (!responses || typeof responses !== 'object') return 0;
    let sum = 0, count = 0;
    for (const val of Object.values(responses)) {
        if (typeof val === 'string' && VALUE_TO_SCORE[val]) {
            sum += VALUE_TO_SCORE[val];
            count++;
        } else {
            const num = Number(val);
            if (Number.isFinite(num) && num >= 1 && num <= 5) {
                sum += num;
                count++;
            }
        }
    }
    return count > 0 ? (sum / count) : 0;
}

const router = express.Router();

const db = require("../db");


// =====================================================
// HOD LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    console.log("========== HOD LOGIN ROUTE HIT ==========");
    console.log("Request Body:", req.body);

    const hodid    = req.body.hodid;
    const password = req.body.password;

    if (!hodid || !password) {
        return res.redirect(
            "/auth/hodfile.html?error=" +
            encodeURIComponent("Please enter your HOD ID and Password")
        );
    }

    try {

        const sql = `
            SELECT hod_id, name, email, password, department, must_change_password
            FROM hod
            WHERE hod_id = $1
              AND password = $2
            LIMIT 1
        `;

        const result = await db.query(sql, [hodid, password]);

        if (result.rows.length === 0) {
            console.log("❌ Invalid HOD ID or Password");
            return res.redirect(
                "/auth/hodfile.html?error=" +
                encodeURIComponent("Invalid HOD ID or Password")
            );
        }

        const hod = result.rows[0];

        req.session.hod = {
            hod_id:     hod.hod_id,
            name:       hod.name,
            email:      hod.email,
            department: hod.department
        };

        req.session.mustChangePassword = !!hod.must_change_password;

        console.log("✅ HOD Login Success:", hod.name);

        req.session.save((sessionError) => {

            if (sessionError) {
                console.error("❌ HOD Session Save Error:", sessionError);
                return res.redirect(
                    "/auth/hodfile.html?error=" +
                    encodeURIComponent("Unable to create login session")
                );
            }

            console.log("✅ HOD session saved");
            if (hod.must_change_password) {
                return res.redirect('/change-password/hod.html');
            }
            return res.redirect("/dashboard/hod-dashboard.html");

        });

    } catch (err) {

        console.error("❌ HOD Database Error:", err);
        return res.redirect(
            "/auth/hodfile.html?error=" +
            encodeURIComponent("Unable to connect to the database")
        );

    }

});


// =====================================================
// HOD INFORMATION
// =====================================================

router.get("/info", (req, res) => {

    if (!req.session || !req.session.hod) {
        return res.status(401).json({
            success: false,
            logged:  false,
            message: "HOD not logged in"
        });
    }

    return res.json({
        success: true,
        logged:  true,
        hod: {
            hod_id:     req.session.hod.hod_id,
            name:       req.session.hod.name,
            email:      req.session.hod.email,
            department: req.session.hod.department
        }
    });

});


// =====================================================
// HOD DASHBOARD — Faculty list + stats
// =====================================================

router.get("/dashboard", async (req, res) => {

    console.log("========== HOD DASHBOARD ROUTE ==========");

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    const department = req.session.hod.department;

    try {

        // Load faculty
        const facultyResult = await db.query(`
            SELECT faculty_id, name, email, department
            FROM faculty
            WHERE LOWER(TRIM(department)) = LOWER(TRIM($1))
            ORDER BY name ASC
        `, [department]);

        const facultyList = facultyResult.rows;

        // Find active cycle
        const cycleResult = await db.query(`
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            WHERE status = 'active'
            ORDER BY id ASC
        `);

        const activeCycles = cycleResult.rows;

        // No active cycle
        if (activeCycles.length === 0) {
            return res.json({
                success:            true,
                department:         department,
                activeCycle:        null,
                totalFaculties:     facultyList.length,
                totalFeedback:      0,
                averageRating:      "0.00",
                facultyWithFeedback: 0,
                bestFaculty:        null,
                lowestFaculty:      null,
                facultyList:        facultyList.map(f => ({
                    faculty_id:    f.faculty_id,
                    name:          f.name,
                    email:         f.email,
                    department:    f.department,
                    totalFeedback: 0,
                    rating:        "0.00"
                }))
            });
        }

        if (activeCycles.length !== 1) {
            console.error("❌ Multiple active cycles detected.");
            return res.status(409).json({
                success: false,
                code:    "MULTIPLE_ACTIVE_CYCLES",
                message: "Feedback-cycle configuration is invalid — multiple cycles are active."
            });
        }

        const activeCycle = activeCycles[0];
        const cycleId     = activeCycle.id;

        // Department-level stats
        const statsResult = await db.query(`
            SELECT responses
            FROM feedback
            WHERE cycle_id = $1
              AND LOWER(TRIM(department)) = LOWER(TRIM($2))
        `, [cycleId, department]);

        const totalFeedback = statsResult.rows.length;
        let deptTotalScore = 0;
        let deptCount = 0;
        for (const row of statsResult.rows) {
            const avg = getFeedbackAverage(row.responses);
            if (avg > 0) { deptTotalScore += avg; deptCount++; }
        }
        const averageRating = deptCount > 0 ? (deptTotalScore / deptCount) : 0;

        // Faculty performance
        const perfResult = await db.query(`
            SELECT
                f.faculty_id,
                f.name,
                f.email,
                f.department,
                fb.responses
            FROM faculty f
            LEFT JOIN feedback fb
                ON fb.faculty_id = f.faculty_id
               AND fb.cycle_id   = $1
            WHERE LOWER(TRIM(f.department)) = LOWER(TRIM($2))
        `, [cycleId, department]);

        const facultyMap = {};
        for (const row of perfResult.rows) {
            if (!facultyMap[row.faculty_id]) {
                facultyMap[row.faculty_id] = { ...row, totalFeedback: 0, ratingSum: 0, ratingCount: 0 };
            }
            if (row.responses) {
                facultyMap[row.faculty_id].totalFeedback++;
                const avg = getFeedbackAverage(row.responses);
                if (avg > 0) {
                    facultyMap[row.faculty_id].ratingSum += avg;
                    facultyMap[row.faculty_id].ratingCount++;
                }
            }
        }
        
        const finalFacultyList = Object.values(facultyMap).map(f => ({
            faculty_id: f.faculty_id,
            name: f.name,
            email: f.email,
            department: f.department,
            totalFeedback: f.totalFeedback,
            rating: f.ratingCount > 0 ? (f.ratingSum / f.ratingCount) : 0
        })).sort((a, b) => b.rating - a.rating);

        

        const facultyWithFeedback = finalFacultyList.filter(f => f.totalFeedback > 0);

        const sortedBest   = [...facultyWithFeedback].sort((a, b) => Number(b.rating) - Number(a.rating));
        const sortedLowest = [...facultyWithFeedback].sort((a, b) => Number(a.rating) - Number(b.rating));

        const bestFaculty   = sortedBest.length   > 0 ? { faculty_id: sortedBest[0].faculty_id,   name: sortedBest[0].name,   rating: Number(sortedBest[0].rating)   } : null;
        const lowestFaculty = sortedLowest.length > 0 ? { faculty_id: sortedLowest[0].faculty_id, name: sortedLowest[0].name, rating: Number(sortedLowest[0].rating) } : null;

        return res.json({
            success:             true,
            department:          department,
            activeCycle: {
                id:         activeCycle.id,
                name:       activeCycle.name,
                start_date: activeCycle.start_date,
                end_date:   activeCycle.end_date,
                status:     activeCycle.status
            },
            totalFaculties:      finalFacultyList.length,
            totalFeedback:       totalFeedback,
            averageRating:       averageRating.toFixed(2),
            facultyWithFeedback: facultyWithFeedback.length,
            bestFaculty:         bestFaculty,
            lowestFaculty:       lowestFaculty,
            facultyList:         finalFacultyList
        });

    } catch (err) {
        console.error("❌ HOD Dashboard Error:", err);
        return res.status(500).json({ success: false, message: "Unable to load dashboard data", error: err.message, stack: err.stack });
    }

});


// =====================================================
// INDIVIDUAL FACULTY ANALYSIS
// =====================================================

router.get("/faculty/:facultyId/analysis", async (req, res) => {

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    const facultyId  = req.params.facultyId;
    const department = req.session.hod.department;

    try {

        const facultyResult = await db.query(`
            SELECT faculty_id, name, email, department
            FROM faculty
            WHERE faculty_id = $1
              AND LOWER(TRIM(department)) = LOWER(TRIM($2))
            LIMIT 1
        `, [facultyId, department]);

        if (facultyResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Faculty not found" });
        }

        const faculty = facultyResult.rows[0];

        const cycleResult = await db.query(`
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            WHERE status = 'active'
            ORDER BY id ASC
        `);

        const cycles = cycleResult.rows;

        if (cycles.length === 0) {
            return res.json({
                success:       true,
                activeCycle:   null,
                faculty:       { faculty_id: faculty.faculty_id, name: faculty.name, email: faculty.email, department: faculty.department },
                totalFeedback: 0,
                averageRating: 0,
                teaching:      0,
                communication: 0,
                behaviour:     0
            });
        }

        if (cycles.length !== 1) {
            return res.status(409).json({ success: false, code: "MULTIPLE_ACTIVE_CYCLES", message: "Multiple cycles are active." });
        }

        const activeCycle = cycles[0];

        const analysisResult = await db.query(`
            SELECT responses
            FROM feedback
            WHERE faculty_id = $1
              AND cycle_id   = $2
              AND LOWER(TRIM(department)) = LOWER(TRIM($3))
        `, [facultyId, activeCycle.id, department]);

        let sumAvg = 0, sumCount = 0;
        let pTeachingSum = 0, pTeachingCount = 0;
        let pCommSum = 0, pCommCount = 0;
        let pBehavSum = 0, pBehavCount = 0;
        
        for (const row of analysisResult.rows) {
            const resData = row.responses || {};
            const avg = getFeedbackAverage(resData);
            if (avg > 0) { sumAvg += avg; sumCount++; }
            
            // Map new dynamic fields to old categories for chart compatibility
            const teaching = Number(resData.course_satisfaction || resData.concept_clarity || 0);
            const comm = Number(resData.student_interaction || resData.doubt_clearing || 0);
            const behav = Number(resData.professionalism || resData.class_control || 0);
            
            if (teaching > 0) { pTeachingSum += teaching; pTeachingCount++; }
            if (comm > 0) { pCommSum += comm; pCommCount++; }
            if (behav > 0) { pBehavSum += behav; pBehavCount++; }
        }

        return res.json({
            success: true,
            activeCycle: {
                id:         activeCycle.id,
                name:       activeCycle.name,
                start_date: activeCycle.start_date,
                end_date:   activeCycle.end_date,
                status:     activeCycle.status
            },
            faculty: {
                faculty_id: faculty.faculty_id,
                name:       faculty.name,
                email:      faculty.email,
                department: faculty.department
            },
            totalFeedback: analysisResult.rows.length,
            averageRating: sumCount > 0 ? (sumAvg / sumCount) : 0, overallRating: sumCount > 0 ? (sumAvg / sumCount) : 0,
            teaching:      pTeachingCount > 0 ? (pTeachingSum / pTeachingCount) : 0,
            communication: pCommCount > 0 ? (pCommSum / pCommCount) : 0,
            behaviour:     pBehavCount > 0 ? (pBehavSum / pBehavCount) : 0
        });

    } catch (err) {
        console.error("❌ Faculty Analysis Error:", err);
        return res.status(500).json({ success: false, message: "Unable to load faculty analysis" });
    }

});


// =====================================================
// MISSING STUDENTS — who haven't submitted feedback
// =====================================================

router.get("/missing-students", async (req, res) => {

    console.log("========== HOD MISSING STUDENTS ROUTE ==========");

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    const department = req.session.hod.department;

    try {

        // Find active cycle
        const cycleResult = await db.query(`
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            WHERE status = 'active'
            ORDER BY id ASC
        `);

        const cycles = cycleResult.rows;

        if (cycles.length === 0) {
            return res.json({
                success:         true,
                activeCycle:     null,
                missingStudents: [],
                totalStudents:   0,
                submitted:       0,
                missing:         0
            });
        }

        if (cycles.length !== 1) {
            return res.status(409).json({
                success: false,
                code:    "MULTIPLE_ACTIVE_CYCLES",
                message: "Multiple active cycles detected."
            });
        }

        const activeCycle = cycles[0];
        const cycleId     = activeCycle.id;

        /*
         * Get all students in the HOD's department and
         * check whether they have submitted at least one
         * feedback entry for the current cycle.
         *
         * We use DISTINCT on student_id inside the
         * feedback table so a student who submitted
         * multiple forms is still counted as "submitted".
         */

        const missingResult = await db.query(`
            SELECT
                s.student_id,
                s.name,
                s.email,
                s.year,
                s.division,
                s.department,
                CASE
                    WHEN COUNT(fs.id) > 0 THEN TRUE
                    ELSE FALSE
                END AS submitted
            FROM students s
            LEFT JOIN feedback_submissions fs
                ON fs.student_id = s.student_id
               AND fs.cycle_id   = $1
            WHERE LOWER(TRIM(s.department)) = LOWER(TRIM($2))
            GROUP BY
                s.student_id,
                s.name,
                s.email,
                s.year,
                s.division,
                s.department
            ORDER BY s.student_id ASC
        `, [cycleId, department]);

        const allStudents     = missingResult.rows;
        const submittedList   = allStudents.filter(s => s.submitted === true  || s.submitted === 't');
        const missingStudents = allStudents.filter(s => s.submitted === false || s.submitted === 'f');

        return res.json({
            success: true,
            activeCycle: {
                id:         activeCycle.id,
                name:       activeCycle.name,
                start_date: activeCycle.start_date,
                end_date:   activeCycle.end_date
            },
            totalStudents: allStudents.length,
            submitted:     submittedList.length,
            missing:       missingStudents.length,
            missingStudents: missingStudents.map(s => ({
                student_id: s.student_id,
                name:       s.name,
                email:      s.email,
                year:       s.year,
                division:   s.division,
                department: s.department
            }))
        });

    } catch (err) {
        console.error("❌ Missing Students Error:", err);
        return res.status(500).json({ success: false, message: "Unable to load missing students" });
    }

});


// =====================================================
// AUTO REPLY — send message to faculty
// =====================================================

router.post("/auto-reply", async (req, res) => {

    console.log("========== HOD AUTO REPLY ROUTE ==========");

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    const { faculty_id, faculty_name, rating_avg, type } = req.body;

    if (!faculty_id || !type) {
        return res.status(400).json({ success: false, message: "faculty_id and type are required" });
    }

    if (type !== "congratulate" && type !== "improve") {
        return res.status(400).json({ success: false, message: "type must be 'congratulate' or 'improve'" });
    }

    const hod_id     = req.session.hod.hod_id;
    const hod_name   = req.session.hod.name;
    const department = req.session.hod.department;
    const name       = faculty_name || "Faculty";
    const avg        = Number(rating_avg || 0).toFixed(2);

    // Build the message text
    let message = "";

    if (type === "congratulate") {
        message =
            `Dear ${name},\n\n` +
            `Congratulations! 🎉 On behalf of the ${department} department, ` +
            `I am pleased to inform you that your average student feedback rating ` +
            `for the current feedback cycle is ${avg} / 5.00. ` +
            `Your dedication, clarity of teaching, and positive interaction with ` +
            `students have been recognised and appreciated.\n\n` +
            `Keep up the excellent work!\n\n` +
            `Best regards,\n${hod_name}\nHead of Department — ${department}`;
    } else {
        message =
            `Dear ${name},\n\n` +
            `This is a constructive feedback message from the ${department} department. ` +
            `Your current average student feedback rating for this cycle is ${avg} / 5.00. ` +
            `We believe there is an opportunity to enhance your teaching effectiveness, ` +
            `communication style, and student engagement.\n\n` +
            `We encourage you to reflect on the feedback and consider attending the ` +
            `upcoming faculty development sessions. Please feel free to reach out ` +
            `if you need any support.\n\n` +
            `Best regards,\n${hod_name}\nHead of Department — ${department}`;
    }

    try {

        // Ensure the hod_messages table exists (idempotent)
        await db.query(`
            CREATE TABLE IF NOT EXISTS hod_messages (
                id          SERIAL PRIMARY KEY,
                hod_id      VARCHAR(50),
                faculty_id  INT,
                faculty_name TEXT,
                message     TEXT NOT NULL,
                rating_avg  NUMERIC(4, 2),
                type        VARCHAR(20) NOT NULL,
                sent_at     TIMESTAMP DEFAULT NOW()
            )
        `);

        // Insert the message record
        const insertResult = await db.query(`
            INSERT INTO hod_messages
                (hod_id, faculty_id, faculty_name, message, rating_avg, type)
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING id, sent_at
        `, [hod_id, faculty_id, name, message, avg, type]);

        const saved = insertResult.rows[0];

        console.log(`✅ Auto-reply sent to faculty ${faculty_id} (${type})`);

        return res.json({
            success:    true,
            message_id: saved.id,
            sent_at:    saved.sent_at,
            type:       type,
            message:    message
        });

    } catch (err) {
        console.error("❌ Auto Reply Error:", err);
        return res.status(500).json({ success: false, message: "Failed to send auto-reply" });
    }

});


// =====================================================
// GET AUTO REPLIES — history of sent messages
// =====================================================

router.get("/auto-replies", async (req, res) => {

    console.log("========== HOD AUTO REPLIES HISTORY ==========");

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    const hod_id = req.session.hod.hod_id;

    try {

        // Ensure table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS hod_messages (
                id          SERIAL PRIMARY KEY,
                hod_id      VARCHAR(50),
                faculty_id  INT,
                faculty_name TEXT,
                message     TEXT NOT NULL,
                rating_avg  NUMERIC(4, 2),
                type        VARCHAR(20) NOT NULL,
                sent_at     TIMESTAMP DEFAULT NOW()
            )
        `);

        const result = await db.query(`
            SELECT id, faculty_id, faculty_name, rating_avg, type, sent_at
            FROM hod_messages
            WHERE hod_id = $1
            ORDER BY sent_at DESC
            LIMIT 50
        `, [hod_id]);

        return res.json({
            success:  true,
            messages: result.rows
        });

    } catch (err) {
        console.error("❌ Auto Replies History Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load message history" });
    }

});



// =====================================================
// HOD — MANAGE FEEDBACK CYCLES
// HOD can create, activate, and end cycles for their dept
// =====================================================

// GET /hod/cycles — list all cycles
router.get("/cycles", async (req, res) => {

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    try {

        const result = await db.query(`
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            ORDER BY id DESC
        `);

        return res.json({ success: true, cycles: result.rows });

    } catch (err) {
        console.error("❌ HOD Cycles Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load cycles" });
    }

});


// POST /hod/cycles/create — create a new cycle
router.post("/cycles/create", async (req, res) => {

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

    const { name, start_date, end_date } = req.body;

    if (!name || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: "Name, start date and end date are required." });
    }

    try {

        const result = await db.query(`
            INSERT INTO feedback_cycles (name, start_date, end_date, status)
            VALUES ($1, $2, $3, 'inactive')
            RETURNING id, name, start_date, end_date, status
        `, [name.trim(), start_date, end_date]);

        const cycle = result.rows[0];

        console.log("✅ HOD created feedback cycle:", cycle.name);

        return res.json({ success: true, message: "Cycle created successfully.", cycle });

    } catch (err) {
        console.error("❌ HOD Create Cycle Error:", err);
        return res.status(500).json({ success: false, message: "Failed to create cycle: " + err.message });
    }

});


// POST /hod/cycles/:id/activate — activate a cycle
router.post("/cycles/:id/activate", async (req, res) => {

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

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

        console.log("✅ HOD activated cycle:", result.rows[0].name);

        return res.json({ success: true, message: "Cycle activated.", cycle: result.rows[0] });

    } catch (err) {
        console.error("❌ HOD Activate Cycle Error:", err);
        return res.status(500).json({ success: false, message: "Failed to activate cycle." });
    }

});


// POST /hod/cycles/:id/end — end a cycle
router.post("/cycles/:id/end", async (req, res) => {

    if (!req.session || !req.session.hod) {
        return res.status(401).json({ success: false, message: "HOD not logged in" });
    }

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

        console.log("✅ HOD ended cycle:", result.rows[0].name);

        return res.json({ success: true, message: "Cycle ended.", cycle: result.rows[0] });

    } catch (err) {
        console.error("❌ HOD End Cycle Error:", err);
        return res.status(500).json({ success: false, message: "Failed to end cycle." });
    }

});


// =====================================================
// CHANGE PASSWORD & USER MANAGEMENT
// =====================================================

// POST /hod/change-password
router.post('/change-password', async (req, res) => {
    if (!req.session || !req.session.hod) return res.redirect('/auth/hodfile.html');
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword !== confirmPassword)
        return res.redirect('/change-password/hod.html?error=Passwords+do+not+match');
    if (newPassword.length < 6)
        return res.redirect('/change-password/hod.html?error=Password+must+be+at+least+6+characters');
    try {
        await db.query(
            'UPDATE hod SET password=$1, must_change_password=FALSE WHERE hod_id=$2',
            [newPassword, req.session.hod.hod_id]
        );
        req.session.mustChangePassword = false;
        return req.session.save(() => res.redirect('/dashboard/hod-dashboard.html'));
    } catch (err) {
        console.error('HOD change-password error:', err);
        return res.redirect('/change-password/hod.html?error=Failed+to+change+password');
    }
});

// GET /hod/department-users — HOD lists users in their own department only
router.get('/department-users', async (req, res) => {
    if (!req.session || !req.session.hod) return res.status(401).json({ success: false, message: 'HOD not logged in' });
    const department = req.session.hod.department;
    try {
        const students = await db.query('SELECT student_id, name, email, year, division FROM students WHERE LOWER(TRIM(department))=LOWER(TRIM($1)) ORDER BY student_id ASC', [department]);
        const faculty  = await db.query('SELECT faculty_id, name, email, subject FROM faculty WHERE LOWER(TRIM(department))=LOWER(TRIM($1)) ORDER BY name ASC', [department]);
        return res.json({ success: true, department, students: students.rows, faculty: faculty.rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load department users' });
    }
});

// POST /hod/reset-password — HOD resets password of user in own department only
router.post('/reset-password', async (req, res) => {
    if (!req.session || !req.session.hod) return res.status(401).json({ success: false, message: 'HOD not logged in' });
    const department = req.session.hod.department;
    const { role, id, newPassword } = req.body;
    if (!role || !id || !newPassword) return res.status(400).json({ success: false, message: 'role, id, newPassword required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password min 6 characters' });
    try {
        if (role === 'student') {
            const check = await db.query('SELECT student_id FROM students WHERE student_id=$1 AND LOWER(TRIM(department))=LOWER(TRIM($2))', [id, department]);
            if (check.rows.length === 0) return res.status(403).json({ success: false, message: 'Student not in your department' });
            await db.query('UPDATE students SET password=$1, must_change_password=TRUE WHERE student_id=$2', [newPassword, id]);
        } else if (role === 'faculty') {
            const check = await db.query('SELECT faculty_id FROM faculty WHERE faculty_id=$1 AND LOWER(TRIM(department))=LOWER(TRIM($2))', [id, department]);
            if (check.rows.length === 0) return res.status(403).json({ success: false, message: 'Faculty not in your department' });
            await db.query('UPDATE faculty SET password=$1, must_change_password=TRUE WHERE faculty_id=$2', [newPassword, id]);
        } else {
            return res.status(400).json({ success: false, message: 'HOD can only reset student or faculty passwords' });
        }
        return res.json({ success: true, message: `Password reset for ${role}: ${id}. They must change it on next login.` });
    } catch (err) {
        console.error('HOD reset password error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});


// =====================================================
// HOD LOGOUT
// =====================================================

router.get("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            console.error("❌ HOD Logout Error:", err);
            return res.status(500).json({ success: false, message: "Logout failed" });
        }

        res.clearCookie("connect.sid");
        console.log("✅ HOD logged out successfully");
        return res.redirect("/auth/hodfile.html");

    });

});


// =====================================================
// EXPORT
// =====================================================


// DELETE /hod/cycles/:id
router.delete("/cycles/:id", async (req, res) => {
    if (!req.session || !req.session.hod) return res.status(401).json({ success: false, message: "HOD not logged in" });
    try {
        await db.query('DELETE FROM feedback_cycles WHERE id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Cycle deleted successfully' });
    } catch (err) {
        console.error('Delete cycle error:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete cycle' });
    }
});

module.exports = router;