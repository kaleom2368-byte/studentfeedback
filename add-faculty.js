const db = require("./db");

const sql = `
    INSERT INTO faculty
    (faculty_id, name, email, password, department, year, division, subject)
    VALUES
    ('FA001', 'Pooja Waghmare', 'pooja.faculty@example.com', 'POOJA001', 'Information Technology', 2, 'A', 'Basic of Computer Networking (BCN)'),
    ('FA002', 'Ashwin Tadkal', 'ashwin.faculty@example.com', 'ASHWIN002', 'Information Technology', 2, 'A', 'DELD'),
    ('FA003', 'Yogeshwari Sarode', 'yogeshwari.faculty@example.com', 'YOGESHWARI003', 'Information Technology', 2, 'A', 'DSA'),
    ('FA004', 'Supriya Manwar', 'supriya.faculty@example.com', 'SUPRIYA004', 'Information Technology', 2, 'A', 'OOP')
`;

db.query(sql, (err, result) => {

    if (err) {
        console.error("? Database Error:", err);
        process.exit(1);
    }

    console.log("? Faculty records added successfully");
    console.log("Rows inserted:", result.affectedRows);

    process.exit(0);
});
