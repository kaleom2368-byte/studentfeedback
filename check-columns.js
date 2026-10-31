require('dotenv').config();
const db = require('./db');
db.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'feedback'")
.then(r => console.log(r.rows)).finally(() => process.exit(0));
