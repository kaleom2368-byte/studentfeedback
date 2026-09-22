const neon = require("./neon-db");

async function test() {
    try {
        console.log("Testing Neon PostgreSQL...");

        const result = await neon.query(`
            SELECT 
                NOW() AS current_time,
                current_database() AS database_name,
                current_user AS user_name
        `);

        console.log("✅ Neon PostgreSQL connected!");
        console.log(result.rows[0]);

    } catch (error) {
        console.error("❌ Neon test failed");
        console.error("Code:", error.code);
        console.error("Message:", error.message);

    } finally {
        await neon.end();
    }
}

test();