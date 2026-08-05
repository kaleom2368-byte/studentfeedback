require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const cors = require("cors");

// ================= ROUTES =================

const studentRoute = require("./routes/student");
const facultyRoute = require("./routes/faculty");
const hodRoute = require("./routes/hod");
const adminRoute = require("./routes/admin");
const feedbackRoute = require("./routes/feedback");
const dashboardRoute = require("./routes/dashboard");
const facultyDirectoryRoute = require("./routes/faculty-directory");

// ================= DATABASE =================

require("./db");

// ================= APP =================

const app = express();

// =====================================================
// SECURITY
// =====================================================

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net"
                ],

                scriptSrcElem: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net"
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://fonts.googleapis.com"
                ],

                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "data:"
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:"
                ],

                connectSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net"
                ]
            }
        }
    })
);

app.use(cors({
    origin: true,
    credentials: true
}));

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =====================================================
// DISABLE CACHE
// =====================================================

app.use((req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );

    res.setHeader(
        "Pragma",
        "no-cache"
    );

    res.setHeader(
        "Expires",
        "0"
    );

    next();

});

// =====================================================
// SESSION
// =====================================================

app.use(session({

    secret:
        process.env.SESSION_SECRET || "StudentFeedback2026",

    resave: false,

    saveUninitialized: false,

    cookie: {

        secure: false,

        httpOnly: true,

        maxAge: 1000 * 60 * 60 * 24

    }

}));

// =====================================================
// STATIC FILES
// =====================================================

app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// ROUTES
// =====================================================

app.use("/student", studentRoute);
app.use("/faculty", facultyRoute);
app.use("/hod", hodRoute);
app.use("/admin", adminRoute);
app.use("/feedback", feedbackRoute);
app.use("/dashboard", dashboardRoute);
app.use("/faculty-directory", facultyDirectoryRoute);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {

    res.json({

        status: "OK",

        environment:
            process.env.NODE_ENV || "development",

        database:
            "Connected"

    });

});

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});

// =====================================================
// 404
// =====================================================

app.use((req, res) => {

    res.status(404).send("404 Page Not Found");

});

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("======================================");
    console.log(" Anonymous Student Feedback System");
    console.log(` Server running on port ${PORT}`);
    console.log(` NODE_ENV = ${process.env.NODE_ENV}`);
    console.log("======================================");

});