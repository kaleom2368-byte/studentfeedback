require('dotenv').config();
const db = require('./db');

const PARAMETERS = [
    "course_satisfaction",
    "syllabus_pace",
    "concept_clarity",
    "practical_work",
    "study_material",
    "exam_difficulty",
    "faculty_support",
    "improvement"
];

const VALUE_TO_SCORE = {
    "Very Satisfied": 5, "Very Appropriate": 5, "Very Clear": 5, "Very Helpful": 5, "Excellent": 5, "Just Right": 5,
    "Satisfied": 4, "Appropriate": 4, "Mostly Clear": 4, "Clear": 4, "Helpful": 4, "Good": 4,
    "Neutral": 3, "Somewhat Clear": 3, "Average": 3,
    "Dissatisfied": 2, "Too Fast": 2, "Not Clear": 2, "Not Helpful": 2, "Difficult": 2, "Needs Improvement": 2, "Poor": 2,
    "Very Dissatisfied": 1, "Too Slow": 1, "Very Difficult": 1, "Very Poor": 1
};

function emptyAverages() {
    return Object.fromEntries(
        PARAMETERS.map(key => [key, 0])
    );
}

function normalizeFeedback(rows) {
    return rows.map(row => {
        let responses = row.responses;

        if (typeof responses === "string") {
            try {
                responses = JSON.parse(responses);
            } catch {
                responses = {};
            }
        }

        if (!responses || typeof responses !== "object") {
            responses = {};
        }

        return {
            id: row.id,
            faculty_id: row.faculty_id,
            subject: row.subject,
            department: row.department,
            cycle_id: row.cycle_id,

            course_satisfaction:
                responses.course_satisfaction ?? null,

            syllabus_pace:
                responses.syllabus_pace ?? null,

            concept_clarity:
                responses.concept_clarity ?? null,

            practical_work:
                responses.practical_work ?? null,

            study_material:
                responses.study_material ?? null,

            exam_difficulty:
                responses.exam_difficulty ?? null,

            faculty_support:
                responses.faculty_support ?? null,

            improvement:
                responses.improvement ?? null,

            comments:
                responses.comments ??
                responses.comment ??
                null
        };
    });
}

function calculateAverages(feedback) {
    const totals = {};
    const counts = {};

    PARAMETERS.forEach(key => {
        totals[key] = 0;
        counts[key] = 0;
    });

    for (const item of feedback) {
        for (const key of PARAMETERS) {
            if (key === "improvement") continue;

            const raw = item[key];

            if (raw === null || raw === undefined || raw === "") {
                continue;
            }

            let score = VALUE_TO_SCORE[String(raw).trim()];

            if (score === undefined) {
                const numeric = Number(raw);

                if (
                    Number.isFinite(numeric) &&
                    numeric >= 1 &&
                    numeric <= 5
                ) {
                    score = numeric;
                }
            }

            if (score >= 1 && score <= 5) {
                totals[key] += score;
                counts[key]++;
            }
        }
    }

    const averages = emptyAverages();

    for (const key of PARAMETERS) {
        if (key === "improvement") continue;

        if (counts[key] > 0) {
            averages[key] = Number(
                (totals[key] / counts[key]).toFixed(1)
            );
        }
    }

    const ratings = PARAMETERS
        .filter(key => key !== "improvement")
        .map(key => averages[key])
        .filter(value => value > 0);

    const overall = ratings.length
        ? Number(
            (
                ratings.reduce(
                    (sum, value) => sum + value,
                    0
                ) / ratings.length
            ).toFixed(1)
        )
        : 0;

    return { averages, overall };
}

async function run() {
    try {
        const id = 'IT-TCH-001';
        const department = 'Information Technology';
        
        const activeCycleResult = await db.query(
            "SELECT id, name, start_date, end_date, status FROM feedback_cycles WHERE status = 'active' LIMIT 1"
        );

        if (activeCycleResult.rows.length === 0) {
            console.log('No active cycle');
            return;
        }

        const activeCycle = activeCycleResult.rows[0];

        const historyResult = await db.query(
            `
            SELECT id, name, start_date, end_date, status
            FROM feedback_cycles
            ORDER BY start_date DESC
            LIMIT 10
            `
        );
        const history = historyResult.rows;

        const submissionsResult = await db.query(
            `
            SELECT
                s.name,
                s.division,
                s.year,
                fs.submitted_at,
                CASE
                    WHEN fs.id IS NOT NULL THEN 'Submitted'
                    ELSE 'Pending'
                END AS submission_status
            FROM students s
            WHERE LOWER(TRIM(s.department)) = LOWER(TRIM($3))
            ORDER BY s.name ASC
            `,
            [id, activeCycle.id, department]
        );
        console.log('Submissions length:', submissionsResult.rows.length);
        
        const feedbackResult = await db.query(
            `
            SELECT * FROM feedback
            WHERE faculty_id = $1
              AND cycle_id = $2
            `,
            [id, activeCycle.id]
        );
        
        const normalized = normalizeFeedback(feedbackResult.rows);
        const { averages, overall } = calculateAverages(normalized);
        console.log('Averages:', averages, 'Overall:', overall);

    } catch (e) {
        console.error('ERROR IS:', e);
    }
    process.exit(0);
}
run();
