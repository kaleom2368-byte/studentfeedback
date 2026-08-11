/* =====================================================
   ALL FEEDBACK PAGE JAVASCRIPT
   ANONYMOUS DETAILED FEEDBACK
   PRESENTATION SAFE VERSION
===================================================== */


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(text) {

    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// FORMAT DATE + TIME
// =====================================================

function formatDateTime(value) {

    if (!value) {
        return "Unknown date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}


// =====================================================
// CREATE FEEDBACK CARD
// =====================================================

function createFeedbackCard(item) {

    const subject = escapeHTML(
        item.subject || "Unknown Subject"
    );

    const department = escapeHTML(
        item.department || "Not Available"
    );

    const courseSatisfaction = escapeHTML(
        item.course_satisfaction || "Not answered"
    );

    const syllabusPace = escapeHTML(
        item.syllabus_pace || "Not answered"
    );

    const conceptClarity = escapeHTML(
        item.concept_clarity || "Not answered"
    );

    const practicalWork = escapeHTML(
        item.practical_work || "Not answered"
    );

    const studyMaterial = escapeHTML(
        item.study_material || "Not answered"
    );

    const examDifficulty = escapeHTML(
        item.exam_difficulty || "Not answered"
    );

    const facultySupport = escapeHTML(
        item.faculty_support || "Not answered"
    );

    const improvement = escapeHTML(
        item.improvement || "Not answered"
    );

    const comments = escapeHTML(
        item.comments || "No additional comments"
    );

    const date = formatDateTime(
        item.submitted_at
    );


    const card = document.createElement("article");

    card.className =
        "feedback-card detailed-feedback-card";


    card.innerHTML =

        '<span class="anonymous-badge">' +
            'Anonymous Feedback' +
        '</span>' +


        '<h3>' +
            'Subject: ' +
            subject +
        '</h3>' +


        '<div class="feedback-meta">' +

            '<div>' +

                '<span>' +
                    'Department' +
                '</span>' +

                '<b>' +
                    department +
                '</b>' +

            '</div>' +


            '<div>' +

                '<span>' +
                    'Submitted' +
                '</span>' +

                '<b>' +
                    date +
                '</b>' +

            '</div>' +

        '</div>' +


        '<div class="feedback-category">' +

            '<h4>' +
                'Course Experience' +
            '</h4>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Course Satisfaction' +
                '</span>' +

                '<b>' +
                    courseSatisfaction +
                '</b>' +

            '</div>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Syllabus Pace' +
                '</span>' +

                '<b>' +
                    syllabusPace +
                '</b>' +

            '</div>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Concept Clarity' +
                '</span>' +

                '<b>' +
                    conceptClarity +
                '</b>' +

            '</div>' +

        '</div>' +


        '<div class="feedback-category">' +

            '<h4>' +
                'Practical Learning' +
            '</h4>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Practical Work' +
                '</span>' +

                '<b>' +
                    practicalWork +
                '</b>' +

            '</div>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Study Material' +
                '</span>' +

                '<b>' +
                    studyMaterial +
                '</b>' +

            '</div>' +

        '</div>' +


        '<div class="feedback-category">' +

            '<h4>' +
                'Assessment' +
            '</h4>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Exam Difficulty' +
                '</span>' +

                '<b>' +
                    examDifficulty +
                '</b>' +

            '</div>' +


            '<div class="answer-row">' +

                '<span>' +
                    'Faculty Support' +
                '</span>' +

                '<b>' +
                    facultySupport +
                '</b>' +

            '</div>' +

        '</div>' +


        '<div class="feedback-category">' +

            '<h4>' +
                'Future Improvement' +
            '</h4>' +


            '<div class="answer-row improvement-answer">' +

                '<b>' +
                    improvement +
                '</b>' +

            '</div>' +

        '</div>' +


        '<div class="comment">' +

            '<strong>' +
                'Additional Suggestions' +
            '</strong>' +


            '<p>' +
                '"' +
                comments +
                '"' +
            '</p>' +

        '</div>';


    return card;
}


// =====================================================
// LOAD ALL FEEDBACK
// =====================================================

async function loadAllFeedback() {

    try {

        const response = await fetch(
            "/faculty/feedback",
            {
                credentials: "include"
            }
        );


        // =============================================
        // SESSION EXPIRED
        // =============================================

        if (response.status === 401) {

            window.location.replace(
                "/auth/faculty.html"
            );

            return;
        }


        // =============================================
        // SERVER ERROR
        // =============================================

        if (!response.ok) {

            throw new Error(
                "Server returned status " +
                response.status
            );
        }


        const data = await response.json();


        const box =
            document.getElementById(
                "feedback-container"
            );


        if (!box) {

            console.error(
                "Feedback container not found"
            );

            return;
        }


        // =============================================
        // INVALID RESPONSE
        // =============================================

        if (!data.success) {

            box.innerHTML =
                '<div class="empty-card">' +
                    'Unable to load feedback.' +
                '</div>';

            return;
        }


        // =============================================
        // NO FEEDBACK
        // =============================================

        if (
            !Array.isArray(data.feedback) ||
            data.feedback.length === 0
        ) {

            box.innerHTML =
                '<div class="empty-card">' +
                    'No feedback available yet.' +
                '</div>';

            return;
        }


        // =============================================
        // CLEAR EXISTING CONTENT
        // =============================================

        box.innerHTML = "";


        // =============================================
        // ADD ALL FEEDBACK CARDS
        // =============================================

        data.feedback.forEach(function(item) {

            const card =
                createFeedbackCard(item);

            box.appendChild(card);

        });


        console.log(
            "All feedback loaded successfully:",
            data.feedback.length,
            "records"
        );

    }

    catch (error) {

        console.error(
            "All Feedback Error:",
            error
        );


        const box =
            document.getElementById(
                "feedback-container"
            );


        if (box) {

            box.innerHTML =
                '<div class="empty-card">' +

                    'Failed to load feedback.' +

                    '<br><br>' +

                    '<small>' +
                        escapeHTML(
                            error.message ||
                            "Server error"
                        ) +
                    '</small>' +

                '</div>';
        }

    }

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadAllFeedback();

    }
);


// =====================================================
// GLOBAL FUNCTION
// =====================================================

window.loadAllFeedback =
    loadAllFeedback;


console.log(
    "all-feedback.js loaded successfully"
);