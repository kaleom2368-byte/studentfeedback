let facultyAnalysis = null;


// =====================================================
// VALUE CONVERSION
// =====================================================

function convertFeedbackValue(
    category,
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }


    const text =
        String(value)
            .trim()
            .toLowerCase();


    const maps = {

        course_satisfaction: {

            "excellent": 5,
            "good": 4,
            "average": 3,
            "poor": 2,
            "very poor": 1

        },


        syllabus_pace: {

            "too slow": 2,
            "appropriate": 4,
            "just right": 4,
            "too fast": 2

        },


        concept_clarity: {

            "very clear": 5,
            "mostly clear": 4,
            "somewhat clear": 3,
            "rarely clear": 2,
            "not clear": 1

        },


        practical_work: {

            "highly effective": 5,
            "effective": 4,
            "somewhat effective": 3,
            "not effective": 2,
            "not applicable": 1

        },


        study_material: {

            "very helpful": 5,
            "helpful": 4,
            "neutral": 3,
            "not helpful": 2,
            "not provided": 1

        },


        exam_difficulty: {

            "too easy": 2,
            "easy": 3,
            "appropriate": 4,
            "moderate": 4,
            "difficult": 4,
            "too difficult": 2

        },


        faculty_support: {

            "always available": 5,
            "usually available": 4,
            "sometimes available": 3,
            "rarely available": 2,
            "did not contact": 0

        }

    };


    if (
        maps[category] &&
        Object.prototype.hasOwnProperty.call(
            maps[category],
            text
        )
    ) {

        return maps[category][text];

    }


    const numeric =
        Number(value);


    if (!Number.isNaN(numeric)) {

        return numeric;

    }


    return 0;

}



// =====================================================
// FORMAT NUMBER
// =====================================================

function formatRating(value) {

    const number =
        Number(value) || 0;

    return number.toFixed(1);

}



// =====================================================
// GET FACULTY ID
// =====================================================

function getFacultyId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("faculty");

}



// =====================================================
// LOAD FACULTY ANALYSIS
// =====================================================

async function loadFacultyAnalysis() {

    const facultyId =
        getFacultyId();


    if (!facultyId) {

        showError(
            "No faculty was selected."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/hod/faculty/${encodeURIComponent(
                    facultyId
                )}/analysis`
            );


        if (response.status === 401) {

            window.location.href =
                "/auth/hodfile.html";

            return;

        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            showError(
                data.message ||
                "Unable to load faculty analysis."
            );

            return;

        }


        facultyAnalysis =
            data;


        renderFacultyProfile();

        renderFacultyDetails();

        renderCorePerformance();

        renderCoursePerformance();

    }

    catch (error) {

        console.error(
            "Faculty analysis error:",
            error
        );


        showError(
            "Unable to connect to the server."
        );

    }

}



// =====================================================
// FACULTY PROFILE
// =====================================================

function renderFacultyProfile() {

    const faculty =
        facultyAnalysis.faculty;


    document.getElementById(
        "faculty-name"
    ).textContent =
        faculty.name || "--";


    document.getElementById(
        "faculty-department"
    ).textContent =
        faculty.department || "--";


    document.getElementById(
        "faculty-id"
    ).textContent =
        faculty.faculty_id || "--";


    document.getElementById(
        "faculty-avatar"
    ).textContent =
        getInitials(
            faculty.name
        );

}



// =====================================================
// FACULTY DETAILS
// =====================================================

function renderFacultyDetails() {

    const faculty =
        facultyAnalysis.faculty;


    document.getElementById(
        "faculty-year"
    ).textContent =
        formatYear(
            faculty.year
        );


    document.getElementById(
        "faculty-division"
    ).textContent =
        faculty.division
            ? `Division ${faculty.division}`
            : "--";


    document.getElementById(
        "total-feedback"
    ).textContent =
        facultyAnalysis.totalFeedback || 0;


    document.getElementById(
        "overall-rating"
    ).textContent =
        formatRating(
            facultyAnalysis.overallRating
        );

}



// =====================================================
// CORE PERFORMANCE
// =====================================================

function renderCorePerformance() {

    setRating(
        "teaching",
        "teaching-bar",
        facultyAnalysis.teaching
    );


    setRating(
        "communication",
        "communication-bar",
        facultyAnalysis.communication
    );


    setRating(
        "behaviour",
        "behaviour-bar",
        facultyAnalysis.behaviour
    );

}



// =====================================================
// COURSE PERFORMANCE
// =====================================================

function renderCoursePerformance() {

    setLearningValue(
        "course-satisfaction",
        facultyAnalysis.course_satisfaction
    );


    setLearningValue(
        "syllabus-pace",
        facultyAnalysis.syllabus_pace
    );


    setLearningValue(
        "concept-clarity",
        facultyAnalysis.concept_clarity
    );


    setLearningValue(
        "practical-work",
        facultyAnalysis.practical_work
    );


    setLearningValue(
        "study-material",
        facultyAnalysis.study_material
    );


    setLearningValue(
        "exam-difficulty",
        facultyAnalysis.exam_difficulty
    );


    setLearningValue(
        "faculty-support",
        facultyAnalysis.faculty_support
    );

}



// =====================================================
// SET RATING
// =====================================================

function setRating(
    valueId,
    barId,
    value
) {

    const rating =
        Number(value) || 0;


    const valueElement =
        document.getElementById(
            valueId
        );


    const barElement =
        document.getElementById(
            barId
        );


    if (valueElement) {

        valueElement.textContent =
            formatRating(rating);

    }


    if (barElement) {

        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    (rating / 5) * 100
                )
            );


        barElement.style.width =
            `${percentage}%`;

    }

}



// =====================================================
// SET LEARNING VALUE
// =====================================================

function setLearningValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    const numeric =
        Number(value) || 0;


    element.textContent =
        formatRating(numeric);

}



// =====================================================
// INITIALS
// =====================================================

function getInitials(name) {

    return String(name || "")
        .trim()
        .split(/\s+/)
        .map(
            word => word.charAt(0)
        )
        .join("")
        .substring(0, 2)
        .toUpperCase();

}



// =====================================================
// FORMAT YEAR
// =====================================================

function formatYear(year) {

    const number =
        Number(year);


    if (number === 1) {
        return "1st Year";
    }


    if (number === 2) {
        return "2nd Year";
    }


    if (number === 3) {
        return "3rd Year";
    }


    if (number === 4) {
        return "4th Year";
    }


    return year
        ? `${year}th Year`
        : "--";

}



// =====================================================
// ERROR DISPLAY
// =====================================================

function showError(message) {

    const container =
        document.querySelector(
            ".analysis-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <section class="error-card">

            <div class="error-icon">
                !
            </div>

            <h2>
                Unable to Load Analysis
            </h2>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                id="error-back-button"
                class="back-btn"
            >
                ← Back to Dashboard
            </button>

        </section>

    `;


    const button =
        document.getElementById(
            "error-back-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            goBackToDashboard
        );

    }

}



// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}



// =====================================================
// BACK TO HOD DASHBOARD
// =====================================================

function goBackToDashboard() {

    window.location.href =
        "/dashboard/hod-dashboard.html";

}



// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const backButton =
            document.getElementById(
                "back-button"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                goBackToDashboard
            );

        }


        loadFacultyAnalysis();

    }
);