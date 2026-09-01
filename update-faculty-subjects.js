const db = require("./db");

const sql = `
    UPDATE faculty
    SET subject = CASE faculty_id
        WHEN 'FA001' THEN 'Basic of Computer Networking (BCN)'
        WHEN 'FA002' THEN 'DELD'
        WHEN 'FA003' THEN 'DSA'
        WHEN 'FA004' THEN 'OOP'
        ELSE subject
    END
    WHERE faculty_id IN ('FA001', 'FA002', 'FA003', 'FA004')
`;

db.query(sql, (err, result) => {

    if (err) {
        console.error("? Database Error:", err);
        process.exit(1);
    }

    console.log("? Faculty subjects updated");
    console.log("Rows updated:", result.affectedRows);

    process.exit(0);
});
