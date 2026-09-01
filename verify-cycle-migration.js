const db = require("./db");

const queries = [
    {
        name: "Feedback table structure",
        sql: "DESCRIBE feedback"
    },
    {
        name: "Feedback cycles",
        sql: "SELECT * FROM feedback_cycles ORDER BY id"
    },
    {
        name: "Feedback cycle assignment",
        sql: "SELECT id, student_id, faculty_id, cycle_id FROM feedback ORDER BY id"
    },
    {
        name: "Cycle counts",
        sql: "SELECT cycle_id, COUNT(*) AS feedback_count FROM feedback GROUP BY cycle_id"
    }
];

function run(index) {
    if (index >= queries.length) {
        db.end();
        return;
    }

    const query = queries[index];

    console.log(`\n========== ${query.name} ==========`);

    db.query(query.sql, (err, rows) => {
        if (err) {
            console.error("Verification failed:");
            console.error(err);
            db.end();
            process.exit(1);
        }

        console.table(rows);
        run(index + 1);
    });
}

run(0);
