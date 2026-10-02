require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('./db');

async function runSeed() {
    try {
        console.log('Running seed-reset.sql ...');
        const sql = fs.readFileSync(path.join(__dirname, 'seed-reset.sql'), 'utf8');
        
        await db.query(sql);
        
        console.log('✅ Seed completed!');
        console.log('Admin      ID: 7020559953  | Pass: pass@123');
        console.log('HOD        ID: 9766979364  | Pass: pass@123');
        console.log('Teacher    ID: IT-TCH-001  | Pass: pass@123');
        console.log('Students:  IT-2201 to IT-2275 | Pass: pass@123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
}

runSeed();
