const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Rover@1103",
    database: "student_feedback"
});

connection.connect((err) => {
    if (err) {
        console.log("❌ MySQL Connection Failed");
        console.log(err);
        return;
    }

    console.log("✅ Connected to MySQL");
});

module.exports = connection;
