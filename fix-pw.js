require('dotenv').config();
const db = require('./db');
db.query("UPDATE students SET must_change_password = FALSE WHERE student_id = 'IT-2201'")
  .then(() => console.log('Updated!'))
  .finally(() => process.exit(0));
