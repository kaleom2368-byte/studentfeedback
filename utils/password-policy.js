"use strict";

const PASSWORD_POLICY_MESSAGE =
    "Password must be at least 6 characters and include at least one special symbol (for example: @, #, or !).";

function isValidPassword(password) {
    return typeof password === "string" &&
        password.length >= 6 &&
        /[^A-Za-z0-9\s]/.test(password);
}

module.exports = {
    isValidPassword,
    PASSWORD_POLICY_MESSAGE
};
