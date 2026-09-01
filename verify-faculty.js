const db = require("./db");

const sql = `
    SELECT
        faculty_id,
        name,
        department,
        subject
    FROM faculty
    ORDER BY faculty_id
`;

db.query(sql, (err, result) => {

    if (err) {
        console.error("? Database Error:", err);
        process.exit(1);
    }

    console.table(result);

    process.exit(0);
});
