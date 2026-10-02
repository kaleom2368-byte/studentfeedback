const fs = require('fs');
let code = fs.readFileSync('routes/hod.js', 'utf8');

// We will add a helper at the top
const helper = `
function getFeedbackAverage(responses) {
    if (!responses || typeof responses !== 'object') return 0;
    let sum = 0, count = 0;
    for (const val of Object.values(responses)) {
        const num = Number(val);
        if (Number.isFinite(num) && num >= 1 && num <= 5) {
            sum += num;
            count++;
        }
    }
    return count > 0 ? (sum / count) : 0;
}
`;
if (!code.includes('getFeedbackAverage')) {
    code = code.replace("const express = require('express');", "const express = require('express');\n" + helper);
}

// 1. Replace dashboard department stats logic
code = code.replace(/const statsResult = await db\.query\(`[\s\S]*?`,\s*\[cycleId,\s*department\]\);[\s\S]*?const averageRating.*?;/m, 
`const statsResult = await db.query(\`
            SELECT responses
            FROM feedback
            WHERE cycle_id = $1
              AND LOWER(TRIM(department)) = LOWER(TRIM($2))
        \`, [cycleId, department]);

        const totalFeedback = statsResult.rows.length;
        let deptTotalScore = 0;
        let deptCount = 0;
        for (const row of statsResult.rows) {
            const avg = getFeedbackAverage(row.responses);
            if (avg > 0) { deptTotalScore += avg; deptCount++; }
        }
        const averageRating = deptCount > 0 ? (deptTotalScore / deptCount) : 0;`);

// 2. Replace dashboard faculty performance logic
code = code.replace(/const perfResult = await db\.query\(`[\s\S]*?f\.department\s*ORDER BY rating DESC\s*`,\s*\[cycleId,\s*department\]\);/m,
`const perfResult = await db.query(\`
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
        \`, [cycleId, department]);

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
        })).sort((a, b) => b.rating - a.rating);`);

code = code.replace(/const finalFacultyList = perfResult\.rows\.map[\s\S]*?\}\)\);/m, "");

// 3. Replace analysis route logic
code = code.replace(/const analysisResult = await db\.query\(`[\s\S]*?`,\s*\[facultyId,\s*activeCycle\.id,\s*department\]\);[\s\S]*?behaviour:\s*Number\(row\.behaviour\s*\|\|\s*0\)\s*\}\);/m,
`const analysisResult = await db.query(\`
            SELECT responses
            FROM feedback
            WHERE faculty_id = $1
              AND cycle_id   = $2
              AND LOWER(TRIM(department)) = LOWER(TRIM($3))
        \`, [facultyId, activeCycle.id, department]);

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
            averageRating: sumCount > 0 ? (sumAvg / sumCount) : 0,
            teaching:      pTeachingCount > 0 ? (pTeachingSum / pTeachingCount) : 0,
            communication: pCommCount > 0 ? (pCommSum / pCommCount) : 0,
            behaviour:     pBehavCount > 0 ? (pBehavSum / pBehavCount) : 0
        });`);

fs.writeFileSync('routes/hod.js', code);
