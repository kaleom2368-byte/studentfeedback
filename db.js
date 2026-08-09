require("dotenv").config();

const mysql = require("mysql2");

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

const db = mysql.createConnection({

    host: process.env.DB_HOST || process.env.MYSQLHOST,

    user: process.env.DB_USER || process.env.MYSQLUSER,

    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,

    database: process.env.DB_NAME || process.env.MYSQL_DATABASE,

    port: process.env.DB_PORT || process.env.MYSQLPORT,

    ssl: {
        rejectUnauthorized: false
    }

});

db.connect((err) => {

    if (err) {

        console.error("❌ MySQL Connection Failed");
        console.error(err);

    } else {

        console.log("✅ Connected to Aiven MySQL");

    }

});

module.exports = db;