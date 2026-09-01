// =====================================================
// FEEDBACK PAGE JAVASCRIPT
// FACULTY / SUBJECT / DEPARTMENT AUTO-SELECTION
// + FEEDBACK PROGRESS TRACKING
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const facultySelect = document.getElementById("faculty");
const subjectSelect = document.getElementById("subject");
const departmentInput = document.getElementById("department");

const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");

let facultyData = [];


// =====================================================
// FEEDBACK QUESTIONS
// =====================================================

// Each radio group represents one question.

const questionGroups = [
    "course_satisfaction",
    "syllabus_pace",
    "concept_clarity",
    "practical_work",
    "study_material",
    "exam_difficulty",
    "faculty_support",
    "improvement"
];


// =====================================================
// LOAD FACULTY DATA
// =====================================================

async function loadFaculty() {

    try {

        const response = await fetch("/feedback/faculty");

        if (!response.ok) {
            throw new Error("Failed to fetch faculty");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.message || "Failed to load faculty"
            );
        }

        facultyData = data.faculty || [];

        populateFaculty();
        populateSubjects();

    } catch (error) {

        console.error(
            "❌ Faculty loading error:",
            error
        );

        if (facultySelect) {
            facultySelect.innerHTML =
                '<option value="">Failed to load faculty</option>';
        }

        if (subjectSelect) {
            subjectSelect.innerHTML =
                '<option value="">Failed to load subjects</option>';
        }

        if (departmentInput) {
            departmentInput.value = "";
        }
    }
}


// =====================================================
// POPULATE FACULTY DROPDOWN
// =====================================================

function populateFaculty() {

    if (!facultySelect) {
        return;
    }

    facultySelect.innerHTML =
        '<option value="">Select Faculty</option>';

    facultyData.forEach(faculty => {

        const option =
            document.createElement("option");

        option.value =
            faculty.faculty_id;

        option.textContent =
            faculty.name;

        facultySelect.appendChild(option);

    });
}


// =====================================================
// POPULATE SUBJECT DROPDOWN
// =====================================================

function populateSubjects() {

    if (!subjectSelect) {
        return;
    }

    subjectSelect.innerHTML =
        '<option value="">Select Subject</option>';

    const subjects = [
        ...new Set(

            facultyData
                .map(faculty => faculty.subject)
                .filter(subject =>
                    subject &&
                    String(subject).trim()
                )

        )
    ];

    subjects.sort((a, b) =>
        String(a).localeCompare(
            String(b)
        )
    );

    subjects.forEach(subject => {

        const option =
            document.createElement("option");

        option.value =
            subject;

        option.textContent =
            subject;

        subjectSelect.appendChild(option);

    });
}


// =====================================================
// FACULTY → SUBJECT + DEPARTMENT
// =====================================================

if (facultySelect) {

    facultySelect.addEventListener(
        "change",
        function () {

            const selectedFacultyId =
                this.value;

            const faculty =
                facultyData.find(
                    item =>
                        String(item.faculty_id) ===
                        String(selectedFacultyId)
                );

            // Nothing selected
            if (!faculty) {

                if (subjectSelect) {
                    subjectSelect.value = "";
                }

                if (departmentInput) {
                    departmentInput.value = "";
                }

                return;
            }

            // Automatically select subject
            if (subjectSelect) {

                subjectSelect.value =
                    faculty.subject || "";

            }

            // Automatically select department
            if (departmentInput) {

                departmentInput.value =
                    faculty.department || "";

            }

        }
    );

}


// =====================================================
// SUBJECT → FACULTY + DEPARTMENT
// =====================================================

if (subjectSelect) {

    subjectSelect.addEventListener(
        "change",
        function () {

            const selectedSubject =
                String(this.value)
                    .trim()
                    .toLowerCase();

            const faculty =
                facultyData.find(
                    item =>
                        String(item.subject || "")
                            .trim()
                            .toLowerCase() ===
                        selectedSubject
                );

            // Nothing selected / subject not found
            if (!faculty) {

                if (facultySelect) {
                    facultySelect.value = "";
                }

                if (departmentInput) {
                    departmentInput.value = "";
                }

                return;
            }

            // Automatically select faculty
            if (facultySelect) {

                facultySelect.value =
                    faculty.faculty_id;

            }

            // Automatically select department
            if (departmentInput) {

                departmentInput.value =
                    faculty.department || "";

            }

        }
    );

}


// =====================================================
// CALCULATE FEEDBACK PROGRESS
// =====================================================

function updateProgress() {

    let answeredQuestions = 0;

    questionGroups.forEach(groupName => {

        const selectedAnswer =
            document.querySelector(
                `input[name="${groupName}"]:checked`
            );

        if (selectedAnswer) {
            answeredQuestions++;
        }

    });


    // Calculate percentage
    const totalQuestions =
        questionGroups.length;

    const percentage =
        Math.round(
            (answeredQuestions / totalQuestions) * 100
        );


    // =================================================
    // UPDATE PERCENTAGE TEXT
    // =================================================

    if (progressPercent) {

        progressPercent.textContent =
            `${percentage}%`;

    }


    // =================================================
    // UPDATE PROGRESS BAR
    // =================================================

    if (progressFill) {

        progressFill.style.width =
            `${percentage}%`;

    }


    // Optional accessibility support
    if (progressFill) {

        progressFill.setAttribute(
            "aria-valuenow",
            percentage
        );

    }


    console.log(
        `📊 Feedback Progress: ${answeredQuestions}/${totalQuestions} (${percentage}%)`
    );

}


// =====================================================
// SETUP PROGRESS LISTENERS
// =====================================================

function setupProgressTracking() {

    questionGroups.forEach(groupName => {

        const radios =
            document.querySelectorAll(
                `input[name="${groupName}"]`
            );

        radios.forEach(radio => {

            radio.addEventListener(
                "change",
                updateProgress
            );

        });

    });


    // Calculate initial progress
    updateProgress();

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadFaculty();

        setupProgressTracking();

    }
);