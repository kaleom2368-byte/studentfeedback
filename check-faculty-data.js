const db = require("./db");

db.query(
    "SELECT faculty_id, name FROM faculty",
    (err, result) => {
        if (err) {
            console.error(err);
            return;
        }

        console.table(result);
        process.exit();
    }
);