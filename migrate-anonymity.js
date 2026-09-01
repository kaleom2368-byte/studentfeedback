require('dotenv').config();
const db = require('./db');

async function migrate() {
    try {
        console.log("Starting anonymity migration...");
        
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS feedback_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(20) NOT NULL,
                faculty_id VARCHAR(20) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await db.promise().query(createTableSql);
        console.log("Created feedback_submissions table.");

        // Check if student_id exists in feedback table before dropping
        const checkColSql = `
            SELECT COUNT(*) AS count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'feedback' 
            AND COLUMN_NAME = 'student_id'
        `;
        const [rows] = await db.promise().query(checkColSql);
        
        if (rows[0].count > 0) {
            await db.promise().query("ALTER TABLE feedback DROP COLUMN student_id");
            console.log("Dropped student_id column from feedback table.");
        } else {
            console.log("student_id column already removed from feedback table.");
        }
        
        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

migrate();
