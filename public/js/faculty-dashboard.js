/* =====================================================
   FACULTY DASHBOARD JAVASCRIPT
   UPGRADED COMPLETE REPLACEMENT
===================================================== */

let ratingChartInstance = null;
let barChartInstance = null;


/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("======================================");
    console.log("FACULTY DASHBOARD INITIALIZING");
    console.log("======================================");

    loadDashboard();

});


/* =====================================================
   MAIN DASHBOARD LOADER
===================================================== */

async function loadDashboard() {

    try {

        const facultyLoaded = await loadFaculty();

        if (!facultyLoaded) {
            return;
        }

        await loadFeedback();

        console.log("======================================");
        console.log("FACULTY DASHBOARD LOADED");
        console.log("======================================");

    } catch (error) {

        console.error(
            "Dashboard Initialization Error:",
            error
        );

    }

}


/* =====================================================
   LOAD FACULTY INFORMATION
===================================================== */

async function loadFaculty() {

    try {

        const response = await fetch(
            "/faculty/info",
            {
                credentials: "include",
                cache: "no-store"
            }
        );


        if (response.status === 401) {

            window.location.replace(
                "/auth/faculty.html"
            );

            return false;

        }


        if (!response.ok) {

            throw new Error(
                "Faculty info request failed: " +
                response.status
            );

        }


        const data = await response.json();


        if (!data.success || !data.faculty) {

            window.location.replace(
                "/auth/faculty.html"
            );

            return false;

        }


        const faculty = data.faculty;


        /* =============================================
           BASIC FACULTY INFORMATION
        ============================================= */

        setText(
    "welcome",
    "Welcome, " +
    (faculty.name || "Faculty") +
    " " +
    htmlEntity("wave")
);


        setText(
            "faculty-id",
            faculty.faculty_id || "N/A"
        );


        setText(
            "faculty-name",
            faculty.name || "N/A"
        );


        setText(
            "faculty-email",
            faculty.email || "N/A"
        );


        setText(
            "faculty-department",
            faculty.department || "N/A"
        );


        /* =============================================
           SUBJECTS

           BACKEND RETURNS:

           subjects: []

           NOT:

           subject: ""
        ============================================= */

        const subjects = Array.isArray(
            faculty.subjects
        )
            ? faculty.subjects
                .map(subject =>
                    String(subject || "").trim()
                )
                .filter(Boolean)
            : [];


        setFacultySubjects(
            subjects
        );


        console.log(
            "Faculty:",
            faculty
        );


        console.log(
            "Faculty Subjects:",
            subjects
        );


        return true;

    } catch (error) {

        console.error(
            "Faculty Info Error:",
            error
        );

        showFacultyInfoError();

        return false;

    }

}


/* =====================================================
   SET FACULTY SUBJECTS
===================================================== */

function setFacultySubjects(subjects) {

    const element =
        document.getElementById(
            "faculty-subject"
        );


    if (!element) {
        return;
    }


    if (
        !Array.isArray(subjects) ||
        subjects.length === 0
    ) {

        element.textContent =
            "Not Assigned";

        return;

    }


    /*
       Display all unique subjects.
    */

    const uniqueSubjects = [
        ...new Set(subjects)
    ];


    element.textContent =
        uniqueSubjects.join(", ");

}


/* =====================================================
   FACULTY INFO ERROR
===================================================== */

function showFacultyInfoError() {

    setText(
        "faculty-id",
        "Unavailable"
    );

    setText(
        "faculty-name",
        "Unable to load"
    );

    setText(
        "faculty-email",
        "Unable to load"
    );

    setText(
        "faculty-department",
        "Unable to load"
    );

    setText(
        "faculty-subject",
        "Unable to load"
    );

}


/* =====================================================
   LOAD FEEDBACK
===================================================== */

async function loadFeedback() {

    try {

        const response = await fetch(
            "/faculty/feedback",
            {
                credentials: "include",
                cache: "no-store"
            }
        );


        if (response.status === 401) {

            window.location.replace(
                "/auth/faculty.html"
            );

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Failed to load feedback: " +
                response.status
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            showNoFeedback();

            return;

        }


        const feedback =
            Array.isArray(data.feedback)
                ? data.feedback
                : [];


        const total =
            Number(data.total) ||
            feedback.length ||
            0;


        const teaching =
            Number(data.teaching) || 0;


        const communication =
            Number(data.communication) || 0;


        const behaviour =
            Number(data.behaviour) || 0;


        const teachAverage =
            Number(data.teachAverage) || 0;


        const commAverage =
            Number(data.commAverage) || 0;


        const behaveAverage =
            Number(data.behaveAverage) || 0;


        const overall =
            Number(data.overall) ||
            calculateOverall(
                teachAverage,
                commAverage,
                behaveAverage
            );


        /* =================================================
           MAIN STATISTICS
        ================================================= */

        animateNumber(
            "total-feedback",
            total
        );


        animateNumber(
            "teaching",
            teaching
        );


        animateNumber(
            "communication",
            communication
        );


        animateNumber(
            "behaviour",
            behaviour
        );


        animateNumber(
            "overall-rating",
            Math.round(overall)
        );


        /* =================================================
           PERFORMANCE ANALYSIS
        ================================================= */

        setProgress(
            "teach-progress",
            "teach-percent",
            ratingToPercent(
                teachAverage
            )
        );


        setText(
            "teach-score",
            `${teachAverage.toFixed(1)} / 5`
        );


        setProgress(
            "comm-progress",
            "comm-percent",
            ratingToPercent(
                commAverage
            )
        );


        setText(
            "comm-score",
            `${commAverage.toFixed(1)} / 5`
        );


        setProgress(
            "behave-progress",
            "behave-percent",
            ratingToPercent(
                behaveAverage
            )
        );


        setText(
            "behave-score",
            `${behaveAverage.toFixed(1)} / 5`
        );


        /* =================================================
           OVERALL SCORE
        ================================================= */

        setText(
            "overall-analysis-score",
            `${overall.toFixed(1)} / 5`
        );


        setText(
            "overall-description",
            getOverallDescription(
                overall
            )
        );


        /* =================================================
           PERFORMANCE INSIGHT
        ================================================= */

        setText(
            "performance-insight-text",
            generatePerformanceInsight(
                teachAverage,
                commAverage,
                behaveAverage,
                overall
            )
        );


        /* =================================================
           REAL-TIME ANALYSIS
        ================================================= */

        updateRealTimeAnalysis(
            data,
            total
        );


        /* =================================================
           CHARTS
        ================================================= */

        createCharts(
            teachAverage,
            commAverage,
            behaveAverage
        );


        /* =================================================
           FEEDBACK
        ================================================= */

        renderFeedbackList(
            feedback
        );


        console.log(
            "Feedback loaded:",
            total
        );

    } catch (error) {

        console.error(
            "Feedback Loading Error:",
            error
        );

        showFeedbackError(
            error.message
        );

    }

}


/* =====================================================
   REAL-TIME ANALYSIS
===================================================== */

function updateRealTimeAnalysis(
    data,
    total
) {

    const analytics =
        document.getElementById(
            "real-time-analysis"
        );


    if (!analytics) {
        return;
    }


    const teachAverage =
        Number(data.teachAverage) || 0;


    const commAverage =
        Number(data.commAverage) || 0;


    const behaveAverage =
        Number(data.behaveAverage) || 0;


    analytics.innerHTML = `

        <div class="analytics-live-card">

            <h3>
                ${htmlEntity("graduation")}
                Teaching
            </h3>

            <div class="average">
                ${teachAverage.toFixed(1)}/5
            </div>

            <p class="responses">
                ${htmlEntity("chart")}
                ${total} Responses
            </p>

        </div>


        <div class="analytics-live-card">

            <h3>
                ${htmlEntity("speech")}
                Communication
            </h3>

            <div class="average">
                ${commAverage.toFixed(1)}/5
            </div>

            <p class="responses">
                ${htmlEntity("chart")}
                ${total} Responses
            </p>

        </div>


        <div class="analytics-live-card">

            <h3>
                ${htmlEntity("thumb")}
                Behaviour
            </h3>

            <div class="average">
                ${behaveAverage.toFixed(1)}/5
            </div>

            <p class="responses">
                ${htmlEntity("chart")}
                ${total} Responses
            </p>

        </div>

    `;

}


/* =====================================================
   CREATE CHARTS
===================================================== */

function createCharts(
    teaching,
    communication,
    behaviour
) {

    const ratingCanvas =
        document.getElementById(
            "ratingChart"
        );


    const barCanvas =
        document.getElementById(
            "barChart"
        );


    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;

    }


    /* =================================================
       DESTROY OLD CHARTS
    ================================================= */

    if (ratingChartInstance) {

        ratingChartInstance.destroy();

        ratingChartInstance = null;

    }


    if (barChartInstance) {

        barChartInstance.destroy();

        barChartInstance = null;

    }


    /* =================================================
       DOUGHNUT CHART
    ================================================= */

    if (ratingCanvas) {

        ratingChartInstance =
            new Chart(
                ratingCanvas,
                {

                    type: "doughnut",

                    data: {

                        labels: [

                            "Teaching",
                            "Communication",
                            "Behaviour"

                        ],

                        datasets: [{

                            data: [

                                teaching,
                                communication,
                                behaviour

                            ],

                            backgroundColor: [

                                "#2563eb",
                                "#3b82f6",
                                "#60a5fa"

                            ],

                            borderWidth: 0,

                            hoverOffset: 8

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        cutout: "70%",

                        plugins: {

                            legend: {

                                position: "bottom",

                                labels: {

                                    color: "#cbd5e1"

                                }

                            }

                        }

                    }

                }
            );

    }


    /* =================================================
       BAR CHART
    ================================================= */

    if (barCanvas) {

        barChartInstance =
            new Chart(
                barCanvas,
                {

                    type: "bar",

                    data: {

                        labels: [

                            "Teaching",
                            "Communication",
                            "Behaviour"

                        ],

                        datasets: [{

                            label:
                                "Average Rating",

                            data: [

                                teaching,
                                communication,
                                behaviour

                            ],

                            backgroundColor: [

                                "#2563eb",
                                "#3b82f6",
                                "#60a5fa"

                            ],

                            borderRadius: 12

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        scales: {

                            y: {

                                beginAtZero: true,

                                max: 5,

                                ticks: {

                                    color:
                                        "#94a3b8",

                                    stepSize: 1

                                }

                            },

                            x: {

                                ticks: {

                                    color:
                                        "#94a3b8"

                                }

                            }

                        },

                        plugins: {

                            legend: {

                                labels: {

                                    color:
                                        "#cbd5e1"

                                }

                            }

                        }

                    }

                }
            );

    }

}


/* =====================================================
   RENDER RECENT ANONYMOUS FEEDBACK
===================================================== */

function renderFeedbackList(
    feedback
) {

    const box =
        document.getElementById(
            "feedback-list"
        );


    if (!box) {
        return;
    }


    if (
        !Array.isArray(feedback) ||
        feedback.length === 0
    ) {

        showNoFeedback();

        return;

    }


    box.innerHTML = "";


    /*
       Show latest 3 feedback records.
    */

    feedback
        .slice(0, 4)
        .forEach(item => {

            box.insertAdjacentHTML(
                "beforeend",
                createDetailedFeedbackCard(
                    item
                )
            );

        });


    /*
       Show View All only when
       there are more than 3.
    */

    if (feedback.length > 3) {

        box.insertAdjacentHTML(
            "beforeend",
            `

            <div class="view-all-box">

                <a href="/dashboard/all-feedback.html">

                    View All Feedback &rarr;

                </a>

            </div>

            `
        );

    }

}


/* =====================================================
   CREATE DETAILED FEEDBACK CARD
===================================================== */

function createDetailedFeedbackCard(
    item
) {

    /*
       IMPORTANT PRIVACY RULE

       NEVER DISPLAY:

       student_id
       student name
       student email

       Faculty only sees anonymous
       feedback information.
    */


    const subject =
        escapeHTML(
            item.subject ||
            "Unknown Subject"
        );


    const department =
        escapeHTML(
            item.department ||
            "Not Available"
        );


    const courseSatisfaction =
        escapeHTML(
            item.course_satisfaction ||
            "Not answered"
        );


    const syllabusPace =
        escapeHTML(
            item.syllabus_pace ||
            "Not answered"
        );


    const conceptClarity =
        escapeHTML(
            item.concept_clarity ||
            "Not answered"
        );


    const practicalWork =
        escapeHTML(
            item.practical_work ||
            "Not answered"
        );


    const studyMaterial =
        escapeHTML(
            item.study_material ||
            "Not answered"
        );


    const examDifficulty =
        escapeHTML(
            item.exam_difficulty ||
            "Not answered"
        );


    const facultySupport =
        escapeHTML(
            item.faculty_support ||
            "Not answered"
        );


    const improvement =
        escapeHTML(
            item.improvement ||
            "Not answered"
        );


    const comments =
        escapeHTML(
            item.comments ||
            "No additional comments"
        );


    const date =
        formatDateTime(
            item.submitted_at
        );


    const teaching =
        clampRating(
            item.teaching
        );


    const communication =
        clampRating(
            item.communication
        );


    const behaviour =
        clampRating(
            item.behaviour
        );


    const overall =
        calculateOverall(
            teaching,
            communication,
            behaviour
        );


    return `

        <article class="feedback-card detailed-feedback-card">


            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="feedback-card-header">

                <div>

                    <span class="feedback-anonymous-badge">

                        ${htmlEntity("lock")}
                        Anonymous Feedback

                    </span>


                    <h3>

                        ${htmlEntity("book")}
                        ${subject}

                    </h3>

                </div>

            </div>


            <!-- =========================================
                 META
            ========================================== -->

            <div class="feedback-meta">

                <div>

                    <span>
                        Department
                    </span>

                    <b>
                        ${department}
                    </b>

                </div>


                <div>

                    <span>
                        Submitted
                    </span>

                    <b>
                        ${date}
                    </b>

                </div>

            </div>


            <!-- =========================================
                 FACULTY RATING SUMMARY
            ========================================== -->

            <div class="feedback-category">

                <h4>

                    ${htmlEntity("star")}
                    Faculty Rating Summary

                </h4>


                <div class="answer-row">

                    <span>
                        Teaching
                    </span>

                    <b>
                        ${teaching} / 5
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Communication
                    </span>

                    <b>
                        ${communication} / 5
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Behaviour
                    </span>

                    <b>
                        ${behaviour} / 5
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Overall
                    </span>

                    <b>
                        ${overall.toFixed(1)} / 5
                    </b>

                </div>

            </div>


            <!-- =========================================
                 COURSE EXPERIENCE
            ========================================== -->

            <div class="feedback-category">

                <h4>

                    ${htmlEntity("book")}
                    Course Experience

                </h4>


                <div class="answer-row">

                    <span>
                        Course Satisfaction
                    </span>

                    <b>
                        ${courseSatisfaction}
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Syllabus Pace
                    </span>

                    <b>
                        ${syllabusPace}
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Concept Clarity
                    </span>

                    <b>
                        ${conceptClarity}
                    </b>

                </div>

            </div>


            <!-- =========================================
                 PRACTICAL LEARNING
            ========================================== -->

            <div class="feedback-category">

                <h4>

                    ${htmlEntity("tools")}
                    Practical Learning

                </h4>


                <div class="answer-row">

                    <span>
                        Practical Work
                    </span>

                    <b>
                        ${practicalWork}
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Study Material
                    </span>

                    <b>
                        ${studyMaterial}
                    </b>

                </div>

            </div>


            <!-- =========================================
                 ASSESSMENT
            ========================================== -->

            <div class="feedback-category">

                <h4>

                    ${htmlEntity("memo")}
                    Assessment

                </h4>


                <div class="answer-row">

                    <span>
                        Exam Difficulty
                    </span>

                    <b>
                        ${examDifficulty}
                    </b>

                </div>


                <div class="answer-row">

                    <span>
                        Faculty Support
                    </span>

                    <b>
                        ${facultySupport}
                    </b>

                </div>

            </div>


            <!-- =========================================
                 IMPROVEMENT
            ========================================== -->

            <div class="feedback-category">

                <h4>

                    ${htmlEntity("bulb")}
                    Future Improvement

                </h4>


                <div class="answer-row improvement-answer">

                    <b>
                        ${improvement}
                    </b>

                </div>

            </div>


            <!-- =========================================
                 COMMENTS
            ========================================== -->

            <div class="anonymous-comment">

                <h4>

                    ${htmlEntity("speech")}
                    Additional Suggestions

                </h4>


                <p>

                    "${comments}"

                </p>

            </div>


        </article>

    `;

}


/* =====================================================
   SHOW NO FEEDBACK
===================================================== */

function showNoFeedback() {

    const box =
        document.getElementById(
            "feedback-list"
        );


    if (!box) {
        return;
    }


    box.innerHTML = `

        <div class="empty-card">

            ${htmlEntity("inbox")}

            No feedback available yet.

        </div>

    `;


    /*
       Reset dashboard values
       when there are no responses.
    */

    setText(
        "total-feedback",
        "0"
    );

    setText(
        "teaching",
        "0"
    );

    setText(
        "communication",
        "0"
    );

    setText(
        "behaviour",
        "0"
    );

    setText(
        "overall-rating",
        "0"
    );

}


/* =====================================================
   SHOW FEEDBACK ERROR
===================================================== */

function showFeedbackError(
    message
) {

    const box =
        document.getElementById(
            "feedback-list"
        );


    if (!box) {
        return;
    }


    box.innerHTML = `

        <div class="empty-card">

            ${htmlEntity("warning")}

            Unable to load feedback.

            <br><br>

            <small>

                ${escapeHTML(
                    message ||
                    "Server error"
                )}

            </small>

        </div>

    `;

}


/* =====================================================
   OVERALL PERFORMANCE DESCRIPTION
===================================================== */

function getOverallDescription(
    rating
) {

    rating =
        Number(rating) || 0;


    if (rating >= 4.5) {

        return (
            "Excellent overall performance based " +
            "on student feedback."
        );

    }


    if (rating >= 4) {

        return (
            "Strong overall performance with " +
            "consistently positive feedback."
        );

    }


    if (rating >= 3) {

        return (
            "Good overall performance with some " +
            "opportunities for improvement."
        );

    }


    if (rating >= 2) {

        return (
            "Performance needs improvement in " +
            "several areas."
        );

    }


    return (
        "More student feedback is needed to " +
        "evaluate overall performance."
    );

}


/* =====================================================
   PERFORMANCE INSIGHT
===================================================== */

function generatePerformanceInsight(
    teaching,
    communication,
    behaviour,
    overall
) {

    const ratings = {

        Teaching:
            Number(teaching) || 0,

        Communication:
            Number(communication) || 0,

        Behaviour:
            Number(behaviour) || 0

    };


    const entries =
        Object.entries(
            ratings
        );


    if (
        overall <= 0
    ) {

        return (
            "There is not enough feedback yet " +
            "to generate a performance insight."
        );

    }


    const highest =
        entries.reduce(
            (a, b) =>
                a[1] >= b[1]
                    ? a
                    : b
        );


    const lowest =
        entries.reduce(
            (a, b) =>
                a[1] <= b[1]
                    ? a
                    : b
        );


    if (
        highest[0] === lowest[0]
    ) {

        return (
            `Your ${highest[0].toLowerCase()} rating is currently ` +
            `${highest[1].toFixed(1)}/5. ` +
            `Continue collecting feedback to identify ` +
            `clear strengths and improvement areas.`
        );

    }


    return (
        `Your strongest area is ` +
        `${highest[0].toLowerCase()} at ` +
        `${highest[1].toFixed(1)}/5. ` +
        `${lowest[0]} currently has the most room ` +
        `for improvement at ` +
        `${lowest[1].toFixed(1)}/5.`
    );

}


/* =====================================================
   NUMBER ANIMATION
===================================================== */

function animateNumber(
    id,
    target
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    target =
        Math.max(
            0,
            Math.round(
                Number(target) || 0
            )
        );


    if (target === 0) {

        element.textContent =
            "0";

        return;

    }


    /*
       Prevent duplicate animation
       from stacking.
    */

    if (
        element._animationTimer
    ) {

        clearInterval(
            element._animationTimer
        );

    }


    let current = 0;


    const timer =
        setInterval(
            () => {

                current++;

                element.textContent =
                    current;


                if (
                    current >= target
                ) {

                    clearInterval(
                        timer
                    );

                    element._animationTimer =
                        null;

                }

            },
            30
        );


    element._animationTimer =
        timer;

}


/* =====================================================
   RATING SCORE DISPLAY
===================================================== */

function setRatingScore(
    id,
    rating
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    rating =
        clampRating(
            rating
        );


    element.textContent =
        rating.toFixed(1) +
        " / 5";

}


/* =====================================================
   CLAMP RATING
===================================================== */

function clampRating(
    rating
) {

    rating =
        Number(rating);


    if (
        !Number.isFinite(rating)
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            5,
            rating
        )
    );

}


/* =====================================================
   PROGRESS BAR
===================================================== */

function setProgress(
    barId,
    textId,
    value
) {

    const progress =
        document.getElementById(
            barId
        );


    const percent =
        document.getElementById(
            textId
        );


    value =
        Number(value) || 0;


    value =
        Math.max(
            0,
            Math.min(
                100,
                value
            )
        );


    if (progress) {

        progress.style.width =
            value + "%";

    }


    if (percent) {

        percent.textContent =
            Math.round(value) +
            "%";

    }

}


/* =====================================================
   RATING TO PERCENT
===================================================== */

function ratingToPercent(
    rating
) {

    rating =
        clampRating(
            rating
        );


    return Math.round(
        (rating / 5) * 100
    );

}


/* =====================================================
   CALCULATE OVERALL
===================================================== */

function calculateOverall(
    teaching,
    communication,
    behaviour
) {

    const values = [

        Number(teaching) || 0,

        Number(communication) || 0,

        Number(behaviour) || 0

    ];


    if (
        values.every(
            value => value === 0
        )
    ) {

        return 0;

    }


    return Number(

        (
            (
                values[0] +
                values[1] +
                values[2]
            ) / 3

        ).toFixed(1)

    );

}


/* =====================================================
   FORMAT DATE + TIME
===================================================== */

function formatDateTime(
    dateValue
) {

    if (!dateValue) {

        return "Unknown date";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown date";

    }


    return date.toLocaleString(
        [],
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =====================================================
   SAFE TEXT SETTER
===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   HTML ENTITY HELPER
===================================================== */

function htmlEntity(
    name
) {

    const entities = {

        wave:
            "👋",

        graduation:
            "🎓",

        speech:
            "💬",

        thumb:
            "👍",

        chart:
            "📊",

        lock:
            "🔒",

        book:
            "📚",

        star:
            "⭐",

        tools:
            "🛠️",

        memo:
            "📝",

        bulb:
            "💡",

        inbox:
            "📨",

        warning:
            "⚠️"

    };


    return entities[name] || "";

}
/* =====================================================
   PAGE RESTORE
===================================================== */

window.addEventListener(
    "pageshow",
    event => {

        if (
            event.persisted
        ) {

            loadDashboard();

        }

    }
);


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.loadFaculty =
    loadFaculty;


window.loadFeedback =
    loadFeedback;


window.loadDashboard =
    loadDashboard;


console.log(
    "faculty-dashboard.js upgraded successfully"
);