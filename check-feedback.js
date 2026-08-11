require("dotenv").config();

const mysql = require("mysql2");

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

        console.error("❌ Database connection failed:");
        console.error(err);

        return;

    }

    console.log("✅ Connected to Aiven MySQL");

    db.query(
        "DESCRIBE feedback",
        (err, result) => {

            if (err) {

                console.error("❌ Failed to describe feedback table:");
                console.error(err);

                db.end();

                return;

            }

            console.log("\n========== FEEDBACK TABLE ==========\n");

            console.table(result);

            console.log("\n====================================\n");

            db.end();

        }
    );

});