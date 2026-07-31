const express = require("express");
const path = require("path");
const session = require("express-session");

require("./db");

const app = express();



app.use(express.urlencoded({
    extended:true
}));

app.use(express.json());



app.use(session({

    secret:"studentfeedbacksecret",

    resave:false,

    saveUninitialized:false

}));



// Static files

app.use(express.static(path.join(__dirname,"public")));




// Routes

const studentRoute = require("./routes/student.js");

const feedbackRoute = require("./routes/feedback.js");

const adminRoute = require("./routes/admin.js");

const facultyRoute = require("./routes/faculty.js");



console.log("Student Route:", typeof studentRoute);

console.log("Feedback Route:", typeof feedbackRoute);





app.use("/student", studentRoute);

app.use("/feedback", feedbackRoute);

app.use("/admin", adminRoute);

app.use("/faculty", facultyRoute);



const PORT = 3000;


app.listen(PORT,"0.0.0.0",()=>{

    console.log(`✅ Server running at http://localhost:${PORT}`);

});
