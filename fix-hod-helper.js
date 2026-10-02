const fs = require('fs');
let code = fs.readFileSync('routes/hod.js', 'utf8');

const helper = `
function getFeedbackAverage(responses) {
    if (typeof responses === 'string') {
        try { responses = JSON.parse(responses); } catch (e) { responses = {}; }
    }
    if (!responses || typeof responses !== 'object') return 0;
    let sum = 0, count = 0;
    for (const val of Object.values(responses)) {
        const num = Number(val);
        if (Number.isFinite(num) && num >= 1 && num <= 5) {
            sum += num;
            count++;
        }
    }
    return count > 0 ? (sum / count) : 0;
}
`;

if (!code.includes('function getFeedbackAverage')) {
    code = code.replace('const express = require("express");', 'const express = require("express");\n' + helper);
    fs.writeFileSync('routes/hod.js', code);
}
