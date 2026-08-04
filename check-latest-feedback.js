const db = require("./db");

db.query(
    "SELECT * FROM feedback ORDER BY id DESC LIMIT 5",
    (err, result) => {
        if (err) {
            console.error(err);
            return;
        }

        console.table(result);
        process.exit();
    }
);