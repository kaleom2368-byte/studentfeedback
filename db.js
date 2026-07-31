const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQLPORT
});

connection.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Failed");
        console.error(err);
        return;
    }

    console.log("✅ Connected to Railway MySQL");
});

module.exports = connection;