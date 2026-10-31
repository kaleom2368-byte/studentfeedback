require('dotenv').config();

async function simulate() {
    console.log("1. Logging in...");
    const loginRes = await fetch("http://localhost:3000/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ student_id: "IT-2201", password: "pass@123" }),
        redirect: "manual"
    });
    
    console.log("Login Status:", loginRes.status);
    const setCookieHeader = loginRes.headers.get("set-cookie");
    if (!setCookieHeader) {
        console.error("No session cookie received! Headers:", Object.fromEntries(loginRes.headers.entries()));
        process.exit(1);
    }
    const cookie = setCookieHeader.split(';')[0];
    console.log("Cookie:", cookie);
    
    console.log("2. Checking status...");
    const statusRes = await fetch("http://localhost:3000/feedback/status", {
        headers: { "Cookie": cookie }
    });
    const statusData = await statusRes.json();
    console.log("Status response:", statusData);
    
    console.log("3. Submitting feedback...");
    const feedbackBody = {
        feedback: {
            "DSA": {
                faculty_id: "IT-TCH-001",
                subject: "DSA",
                answers: {
                    course_satisfaction: "Satisfied"
                }
            }
        }
    };
    
    const submitRes = await fetch("http://localhost:3000/feedback/submit-all", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": cookie
        },
        body: JSON.stringify(feedbackBody)
    });
    
    console.log("Submit Status:", submitRes.status);
    const submitData = await submitRes.json();
    console.log("Submit response:", submitData);
    
    if (submitData.success) {
        console.log("✅ Simulation perfectly successful!");
    } else {
        console.log("❌ Simulation failed!");
    }
}
simulate();
