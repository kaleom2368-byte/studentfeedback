require('dotenv').config();
const db = require('./db');

async function fixDb() {
    try {
        console.log("Removing legacy NOT NULL constraints from feedback table...");
        await db.query(`
            ALTER TABLE feedback 
            ALTER COLUMN teaching DROP NOT NULL,
            ALTER COLUMN communication DROP NOT NULL,
            ALTER COLUMN behaviour DROP NOT NULL;
        `);
        console.log("✅ Dropped NOT NULL constraints!");
        
        // Also fix the seed-reset.sql so it doesn't happen again
        const fs = require('fs');
        const path = require('path');
        const seedPath = path.join(__dirname, 'seed-reset.sql');
        let sql = fs.readFileSync(seedPath, 'utf8');
        sql = sql.replace(/teaching INT NOT NULL,/g, 'teaching INT,');
        sql = sql.replace(/communication INT NOT NULL,/g, 'communication INT,');
        sql = sql.replace(/behaviour INT NOT NULL,/g, 'behaviour INT,');
        fs.writeFileSync(seedPath, sql);
        console.log("✅ seed-reset.sql fixed!");

        process.exit(0);
    } catch (err) {
        console.error("❌ Fix failed:", err);
        process.exit(1);
    }
}

fixDb();
