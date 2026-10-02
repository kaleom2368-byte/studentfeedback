const db = require('./db');
async function run() {
    await db.query("UPDATE students SET division = 'B'");
    console.log("Updated!");
    process.exit(0);
}
run();
