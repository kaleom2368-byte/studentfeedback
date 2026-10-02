require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
});

pool.connect()
    .then((client) => {
        console.log("✅ Connected to Neon PostgreSQL");
        client.release();
    })
    .catch((err) => {
        console.error("❌ Neon PostgreSQL Connection Failed");
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
    });

module.exports = pool;