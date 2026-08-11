const db = require("./db");

const sql = `
ALTER TABLE feedback

ADD COLUMN course_satisfaction VARCHAR(100) NULL,
ADD COLUMN syllabus_pace VARCHAR(100) NULL,
ADD COLUMN concept_clarity VARCHAR(100) NULL,
ADD COLUMN practical_work VARCHAR(100) NULL,
ADD COLUMN study_material VARCHAR(100) NULL,
ADD COLUMN exam_difficulty VARCHAR(100) NULL,
ADD COLUMN faculty_support VARCHAR(100) NULL,
ADD COLUMN improvement TEXT NULL
`;

console.log("========== UPDATING FEEDBACK TABLE ==========");

db.query(sql, (err) => {

    if (err) {

        console.error(
            "❌ Failed to update feedback table:"
        );

        console.error(err);

        process.exit(1);

    }

    console.log(
        "✅ Feedback table updated successfully!"
    );

    console.log(
        "Added:"
    );

    console.log(
        "- course_satisfaction"
    );

    console.log(
        "- syllabus_pace"
    );

    console.log(
        "- concept_clarity"
    );

    console.log(
        "- practical_work"
    );

    console.log(
        "- study_material"
    );

    console.log(
        "- exam_difficulty"
    );

    console.log(
        "- faculty_support"
    );

    console.log(
        "- improvement"
    );

    console.log(
        "============================================"
    );

    process.exit(0);

});