require("dotenv").config();

const crypto = require("crypto");
const readline = require("readline");
const db = require("./db");

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function createInterface() {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error(
            "This script must be run directly in an interactive terminal."
        );
    }

    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function askHidden(question) {
    return new Promise((resolve, reject) => {
        if (!process.stdin.isTTY || !process.stdout.isTTY) {
            reject(
                new Error(
                    "Password input requires an interactive terminal."
                )
            );
            return;
        }

        let password = "";

        process.stdout.write(question);

        const wasRaw = process.stdin.isRaw;

        const cleanup = () => {
            process.stdin.removeListener("data", onData);

            if (process.stdin.isTTY) {
                process.stdin.setRawMode(Boolean(wasRaw));
            }

            process.stdin.pause();
            process.stdout.write("\n");
        };

        const onData = (chunk) => {
            const input = chunk.toString("utf8");

            // Ctrl+C
            if (input === "\u0003") {
                cleanup();
                reject(new Error("Setup cancelled."));
                return;
            }

            // Enter
            if (input === "\r" || input === "\n") {
                cleanup();
                resolve(password);
                return;
            }

            // Backspace
            if (input === "\u0008" || input === "\u007f") {
                if (password.length > 0) {
                    password = password.slice(0, -1);
                }
                return;
            }

            // Ignore other control characters
            if (input.charCodeAt(0) < 32) {
                return;
            }

            password += input;
        };

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on("data", onData);
    });
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("base64");

    return new Promise((resolve, reject) => {
        crypto.scrypt(
            password,
            salt,
            KEY_LENGTH,
            {
                N: SCRYPT_N,
                r: SCRYPT_R,
                p: SCRYPT_P,
                maxmem: 64 * 1024 * 1024
            },
            (error, derivedKey) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(
                    `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derivedKey.toString(
                        "base64"
                    )}`
                );
            }
        );
    });
}

async function createAdmin() {
    let connection;
    let rl;

    try {
        rl = createInterface();

        const username = (
            await ask(rl, "Admin username/ID: ")
        ).trim();

        if (!username) {
            throw new Error("Admin username/ID is required.");
        }

        // Stop readline while using hidden password input.
        rl.close();
        rl = null;

        const password = await askHidden("Admin password: ");

        const passwordConfirmation = await askHidden(
            "Confirm Admin password: "
        );

        if (!password) {
            throw new Error("Admin password is required.");
        }

        if (password !== passwordConfirmation) {
            throw new Error(
                "Passwords do not match. No Admin account was created."
            );
        }

        const passwordHash = await hashPassword(password);

        connection = await db.promise().getConnection();

        const [existingAccounts] = await connection.query(
            "SELECT id FROM admin WHERE username = ? LIMIT 1",
            [username]
        );

        if (existingAccounts.length > 0) {
            throw new Error(
                "That Admin username/ID already exists. No account was created."
            );
        }

        await connection.query(
            "INSERT INTO admin (username, password) VALUES (?, ?)",
            [username, passwordHash]
        );

        console.log("\nAdmin account created successfully.");
    } catch (error) {
        console.error(
            "\nAdmin account setup failed:",
            error.message
        );

        process.exitCode = 1;
    } finally {
        if (rl) {
            rl.close();
        }

        if (connection) {
            connection.release();
        }

        try {
            await db.promise().end();
        } catch (error) {
            // Ignore database shutdown errors during cleanup.
        }
    }
}

createAdmin();