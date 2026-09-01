const db = require("./db");

const sql = `
    ALTER TABLE faculty
    ADD COLUMN subject VARCHAR(100) NOT NULL DEFAULT ''
`;

db.query(sql, (err) => {

    if (err) {
        console.error("? Database Error:", err);
        process.exit(1);
    }

    console.log("? subject column added to Aiven faculty table");

    process.exit(0);
});
