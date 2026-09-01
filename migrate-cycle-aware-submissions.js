require("dotenv").config();

const db = require("./db");

const AUDIT_TABLE = "feedback_cycle_backfill_audit";
const LEGACY_CYCLE_NAME = "Legacy Feedback";

async function tableExists(connection, tableName) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [tableName]
    );

    return Number(rows[0].count) > 0;
}

async function columnExists(connection, tableName, columnName) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tableName, columnName]
    );

    return Number(rows[0].count) > 0;
}

async function indexExists(connection, tableName, indexName) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [tableName, indexName]
    );

    return Number(rows[0].count) > 0;
}

async function foreignKeyExists(connection, tableName, constraintName) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND CONSTRAINT_NAME = ?
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        [tableName, constraintName]
    );

    return Number(rows[0].count) > 0;
}

async function requireNoOrphanedCycles(connection, tableName) {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM ${tableName} record
         LEFT JOIN feedback_cycles cycle ON cycle.id = record.cycle_id
         WHERE record.cycle_id IS NULL OR cycle.id IS NULL`
    );

    if (Number(rows[0].count) > 0) {
        throw new Error(`${tableName} contains missing or invalid cycle references.`);
    }
}

async function migrate() {
    const connection = await db.promise().getConnection();

    try {
        console.log("Starting cycle-aware submission migration...");

        const [legacyCycles] = await connection.query(
            `SELECT id FROM feedback_cycles WHERE name = ? ORDER BY id`,
            [LEGACY_CYCLE_NAME]
        );

        if (legacyCycles.length !== 1) {
            throw new Error(
                `Expected exactly one '${LEGACY_CYCLE_NAME}' cycle; found ${legacyCycles.length}. No changes were made.`
            );
        }

        const legacyCycleId = legacyCycles[0].id;

        if (!(await tableExists(connection, AUDIT_TABLE))) {
            await connection.query(`
                CREATE TABLE ${AUDIT_TABLE} (
                    feedback_id INT NOT NULL PRIMARY KEY,
                    original_cycle_id INT NULL,
                    captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        await connection.query(`
            INSERT IGNORE INTO ${AUDIT_TABLE} (feedback_id, original_cycle_id)
            SELECT id, cycle_id
            FROM feedback
        `);

        const [auditCountRows] = await connection.query(
            `SELECT COUNT(*) AS count FROM ${AUDIT_TABLE}`
        );
        const [feedbackCountRows] = await connection.query(
            "SELECT COUNT(*) AS count FROM feedback"
        );

        if (Number(auditCountRows[0].count) < Number(feedbackCountRows[0].count)) {
            throw new Error("Feedback audit backup is incomplete. No backfill was performed.");
        }

        const [backfillResult] = await connection.query(
            "UPDATE feedback SET cycle_id = ? WHERE cycle_id IS NULL",
            [legacyCycleId]
        );
        console.log(`Legacy backfill updated ${backfillResult.affectedRows} feedback row(s).`);

        await requireNoOrphanedCycles(connection, "feedback");

        if (!(await columnExists(connection, "feedback_submissions", "cycle_id"))) {
            await connection.query(
                "ALTER TABLE feedback_submissions ADD COLUMN cycle_id INT NULL"
            );
        }

        const [submissionCountRows] = await connection.query(
            "SELECT COUNT(*) AS count FROM feedback_submissions"
        );
        const submissionCount = Number(submissionCountRows[0].count);

        if (submissionCount !== 0) {
            const [nullCycleRows] = await connection.query(
                "SELECT COUNT(*) AS count FROM feedback_submissions WHERE cycle_id IS NULL"
            );

            if (Number(nullCycleRows[0].count) > 0) {
                throw new Error(
                    "feedback_submissions contains existing rows without cycle_id. No tracking backfill is safe, so migration stopped."
                );
            }
        }

        await connection.query(
            "ALTER TABLE feedback_submissions MODIFY COLUMN cycle_id INT NOT NULL"
        );
        await connection.query(
            "ALTER TABLE feedback MODIFY COLUMN cycle_id INT NOT NULL"
        );

        const [duplicateRows] = await connection.query(`
            SELECT student_id, faculty_id, cycle_id, COUNT(*) AS count
            FROM feedback_submissions
            GROUP BY student_id, faculty_id, cycle_id
            HAVING COUNT(*) > 1
        `);

        if (duplicateRows.length > 0) {
            throw new Error(
                "Duplicate student/faculty/cycle tracking rows exist. Unique constraint was not added."
            );
        }

        if (!(await indexExists(connection, "feedback_submissions", "uq_feedback_submissions_student_faculty_cycle"))) {
            await connection.query(`
                ALTER TABLE feedback_submissions
                ADD CONSTRAINT uq_feedback_submissions_student_faculty_cycle
                UNIQUE (student_id, faculty_id, cycle_id)
            `);
        }

        if (!(await indexExists(connection, "feedback_submissions", "idx_feedback_submissions_faculty_cycle"))) {
            await connection.query(`
                ALTER TABLE feedback_submissions
                ADD INDEX idx_feedback_submissions_faculty_cycle (faculty_id, cycle_id)
            `);
        }

        await requireNoOrphanedCycles(connection, "feedback_submissions");

        if (!(await foreignKeyExists(connection, "feedback", "fk_feedback_cycle"))) {
            await connection.query(`
                ALTER TABLE feedback
                ADD CONSTRAINT fk_feedback_cycle
                FOREIGN KEY (cycle_id) REFERENCES feedback_cycles(id)
            `);
        }

        if (!(await foreignKeyExists(connection, "feedback_submissions", "fk_feedback_submissions_cycle"))) {
            await connection.query(`
                ALTER TABLE feedback_submissions
                ADD CONSTRAINT fk_feedback_submissions_cycle
                FOREIGN KEY (cycle_id) REFERENCES feedback_cycles(id)
            `);
        }

        console.log("Cycle-aware submission migration completed successfully.");
    } finally {
        connection.release();
        await db.promise().end();
    }
}

migrate().catch((error) => {
    console.error("Cycle-aware submission migration failed:", error.message);
    process.exitCode = 1;
});
