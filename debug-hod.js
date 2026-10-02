const express = require('express');
const router = require('./routes/hod');
const db = require('./db');

async function debugHOD() {
    try {
        const cycleId = 1;
        const department = "Information Technology";
        
        // Exact copy of the code from routes/hod.js
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
            // Wait, does getFeedbackAverage exist in this scope?
            // In routes/hod.js I injected it at the top.
        }
        
    } catch (err) {
        console.error(err);
    }
}
