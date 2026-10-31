require('dotenv').config();
const db = require('./db');
db.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'feedback_submissions'::regclass")
.then(r => console.log(r.rows)).finally(() => process.exit(0));
