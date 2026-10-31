require('dotenv').config();
const http = require('http');

async function doRequest(path, method, data, cookie) {
    return new Promise((resolve, reject) => {
        const payload = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : '';
        const headers = {
            'Content-Type': typeof data === 'string' ? 'application/x-www-form-urlencoded' : 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        };
        if (cookie) headers['Cookie'] = cookie;
        
        const req = http.request({ hostname: 'localhost', port: 3000, path, method, headers }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const setCookie = res.headers['set-cookie'];
                resolve({ status: res.statusCode, headers: res.headers, body, setCookie });
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function test() {
    try {
        console.log('Logging in as student...');
        const login = await doRequest('/student/login', 'POST', 'student_id=IT-2201&password=pass@123');
        
        let cookie = null;
        if (login.setCookie) {
            cookie = login.setCookie[0].split(';')[0];
        }
        console.log('Login status:', login.status);
        console.log('Cookie obtained:', cookie);
        
        console.log('Submitting feedback...');
        const feedbackData = {
            feedback: {
                "DSA": {
                    faculty_id: "IT-TCH-001",
                    subject: "DSA",
                    answers: {
                        course_satisfaction: "Satisfied",
                        concept_clarity: "Clear"
                    }
                }
            }
        };
        
        const submit = await doRequest('/feedback/submit-all', 'POST', feedbackData, cookie);
        console.log('Submit status:', submit.status);
        console.log('Submit response:', submit.body);
    } catch(e) {
        console.error(e);
    }
}
test();
