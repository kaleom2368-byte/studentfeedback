const db = require("./db");

const steps = [
    {
        name: "Add cycle_id column",
        sql: `
            ALTER TABLE feedback
            ADD COLUMN cycle_id INT NULL
        `
    },
    {
        name: "Create legacy cycle",
        sql: `
            INSERT INTO feedback_cycles
                (name, start_date, end_date, status)
            VALUES
                ('Legacy Feedback', '2000-01-01', '2000-01-01', 'inactive')
        `
    },
    {
        name: "Assign existing feedback to legacy cycle",
        sql: `
            UPDATE feedback
            SET cycle_id = (
                SELECT id
                FROM feedback_cycles
                WHERE name = 'Legacy Feedback'
                ORDER BY id DESC
                LIMIT 1
            )
            WHERE cycle_id IS NULL
        `
    }
];

function runStep(index) {
    if (index >= steps.length) {
        console.log("");
        console.log("==========================================");
        console.log("? Step 2B migration completed successfully");
        console.log("==========================================");
        db.end();
        return;
    }

    const step = steps[index];

    console.log(`\n?? ${step.name}`);

    db.query(step.sql, (err) => {
        if (err) {
            console.error(`? Failed: ${step.name}`);
            console.error(err);
            db.end();
            process.exit(1);
        }

        console.log(`? Completed: ${step.name}`);
        runStep(index + 1);
    });
}

runStep(0);
