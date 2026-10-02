const fetch = require('node-fetch');

async function test() {
    // 1. login student
    const loginRes = await fetch('http://localhost:3000/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'studentid=IT-2201&password=pass@123'
    });
    console.log('Login:', loginRes.url); // Should redirect to /change-password/student.html because must_change_password is true

    // wait, we can't test session easily with node-fetch without a cookie jar.
    console.log('Test skipped.');
}
test();
