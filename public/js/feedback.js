/* =========================================================
   ANONYMOUS STUDENT FEEDBACK SYSTEM
   FEEDBACK JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeOtherOptions();

    initializeNavigationButtons();

    initializeLogout();

    initializeFaculty();

    initializeProgress();

    initializeCharacterCounter();

    initializeWordFilter();

});


/* =========================================================
   1. OTHER OPTION HANDLER
========================================================= */

function initializeOtherOptions() {

    const otherInputs =
        document.querySelectorAll(".other-input");

    otherInputs.forEach((otherInput) => {

        const inputName = otherInput.name;

        if (!inputName) {
            return;
        }

        const radioName =
            inputName.replace("_other", "");

        const radioButtons =
            document.querySelectorAll(
                `input[name="${radioName}"]`
            );

        if (!radioButtons.length) {
            return;
        }

        // Hide Other input initially
        otherInput.style.display = "none";
        otherInput.required = false;

        radioButtons.forEach((radio) => {

            radio.addEventListener("change", () => {

                if (
                    radio.value.trim().toLowerCase() === "other"
                ) {

                    otherInput.style.display = "block";

                    otherInput.required = true;

                    setTimeout(() => {
                        otherInput.focus();
                    }, 50);

                } else {

                    otherInput.style.display = "none";

                    otherInput.value = "";

                    otherInput.required = false;

                }

                updateProgress();

            });

        });


        // Restore Other field if already selected
        const selected =
            document.querySelector(
                `input[name="${radioName}"]:checked`
            );

        if (
            selected &&
            selected.value.trim().toLowerCase() === "other"
        ) {

            otherInput.style.display = "block";

            otherInput.required = true;

        }

    });

}


/* =========================================================
   2. BACK TO DASHBOARD
========================================================= */

function initializeNavigationButtons() {

    const backButton =
        document.getElementById("back-dashboard-btn");

    if (!backButton) {
        return;
    }

    backButton.addEventListener("click", () => {

        window.location.href =
            "/dashboard/student-dashboard.html";

    });

}


/* =========================================================
   3. STUDENT LOGOUT
========================================================= */

function initializeLogout() {

    const logoutButton =
        document.getElementById("logout-btn");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", () => {

        const confirmLogout =
            window.confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmLogout) {
            return;
        }

        window.location.href =
            "/student/logout";

    });

}


/* =========================================================
   4. FACULTY LOADING
========================================================= */

function initializeFaculty() {

    const facultySelect =
        document.getElementById("faculty");

    const departmentInput =
        document.getElementById("department");

    if (!facultySelect) {
        return;
    }


    fetch("/faculty-directory", {

        method: "GET",

        credentials: "include",

        cache: "no-store"

    })

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    `Faculty request failed: ${response.status}`
                );

            }

            return response.json();

        })

        .then(data => {

            facultySelect.innerHTML = "";

            const defaultOption =
                document.createElement("option");

            defaultOption.value = "";

            defaultOption.textContent =
                "Select Faculty";

            defaultOption.disabled = true;

            defaultOption.selected = true;

            facultySelect.appendChild(
                defaultOption
            );


            const facultyList =
                Array.isArray(data)
                    ? data
                    : data.faculty ||
                      data.facultyList ||
                      data.data ||
                      [];


            if (!facultyList.length) {

                const emptyOption =
                    document.createElement("option");

                emptyOption.value = "";

                emptyOption.textContent =
                    "No faculty available";

                emptyOption.disabled = true;

                facultySelect.appendChild(
                    emptyOption
                );

                return;

            }


            facultyList.forEach(faculty => {

                const option =
                    document.createElement("option");


                option.value =
                    faculty.faculty_id ??
                    faculty.id ??
                    faculty.user_id ??
                    "";


                option.textContent =
                    faculty.name ??
                    faculty.faculty_name ??
                    faculty.full_name ??
                    faculty.username ??
                    "Unknown Faculty";


                option.dataset.department =
                    faculty.department ??
                    faculty.department_name ??
                    "";


                facultySelect.appendChild(
                    option
                );

            });

        })

        .catch(error => {

            console.error(
                "❌ Failed to load faculty:",
                error
            );


            facultySelect.innerHTML = "";


            const errorOption =
                document.createElement("option");

            errorOption.value = "";

            errorOption.textContent =
                "Unable to load faculty";

            errorOption.disabled = true;

            facultySelect.appendChild(
                errorOption
            );

        });


    /* =====================================================
       FACULTY CHANGE
    ===================================================== */

    facultySelect.addEventListener(
        "change",
        () => {

            const selectedOption =
                facultySelect.options[
                    facultySelect.selectedIndex
                ];


            if (!selectedOption) {
                return;
            }


            if (departmentInput) {

                departmentInput.value =
                    selectedOption.dataset.department || "";

            }


            updateProgress();

        }
    );

}


/* =========================================================
   5. PROGRESS INITIALIZATION
========================================================= */

function initializeProgress() {

    const form =
        document.getElementById("feedback-form");

    if (!form) {
        return;
    }


    const watchedInputs =
        form.querySelectorAll(
            "input[type='radio'], " +
            "select, " +
            "input[type='text'], " +
            "textarea"
        );


    watchedInputs.forEach(input => {

        input.addEventListener(
            "change",
            updateProgress
        );

        input.addEventListener(
            "input",
            updateProgress
        );

    });


    updateProgress();

}


/* =========================================================
   6. UPDATE PROGRESS
========================================================= */

function updateProgress() {

    const form =
        document.getElementById("feedback-form");

    const progressFill =
        document.getElementById("progress-fill");

    const progressPercent =
        document.getElementById("progress-percent");


    if (
        !form ||
        !progressFill ||
        !progressPercent
    ) {

        return;

    }


    const questionNames = [

        "course_satisfaction",

        "syllabus_pace",

        "concept_clarity",

        "practical_work",

        "study_material",

        "exam_difficulty",

        "faculty_support",

        "improvement"

    ];


    let answered = 0;


    questionNames.forEach(name => {

        const selected =
            form.querySelector(
                `input[name="${name}"]:checked`
            );


        if (!selected) {
            return;
        }


        if (
            selected.value.trim().toLowerCase() ===
            "other"
        ) {

            const otherInput =
                form.querySelector(
                    `[name="${name}_other"]`
                );


            if (
                otherInput &&
                otherInput.value.trim() !== ""
            ) {

                answered++;

            }

        } else {

            answered++;

        }

    });


    const totalQuestions =
        questionNames.length;


    const percentage =
        Math.round(
            (answered / totalQuestions) * 100
        );


    progressFill.style.width =
        `${percentage}%`;


    progressPercent.textContent =
        `${percentage}%`;

}


/* =========================================================
   7. CHARACTER COUNTER
========================================================= */

function initializeCharacterCounter() {

    const comments =
        document.getElementById("comments");

    const counter =
        document.getElementById("char-count");


    if (
        !comments ||
        !counter
    ) {

        return;

    }


    function updateCounter() {

        const length =
            comments.value.length;


        counter.textContent =
            `${length} / 500`;


        counter.classList.remove(
            "warning",
            "limit"
        );


        if (length >= 500) {

            counter.classList.add(
                "limit"
            );

        }

        else if (length >= 450) {

            counter.classList.add(
                "warning"
            );

        }

    }


    comments.addEventListener(
        "input",
        updateCounter
    );


    updateCounter();

}


/* =========================================================
   8. WORD FILTER
========================================================= */

function initializeWordFilter() {

    const comments =
        document.getElementById("comments");

    const warning =
        document.getElementById("word-warning");


    if (
        !comments ||
        !warning
    ) {

        return;

    }


    const blockedWords = [

        "fuck",
        "fucking",
        "shit",
        "bitch",
        "asshole",
        "bastard",
        "idiot",
        "stupid"

    ];


    comments.addEventListener(
        "input",
        () => {

            const text =
                comments.value.toLowerCase();


            const foundWord =
                blockedWords.find(word => {

                    const pattern =
                        new RegExp(
                            `\\b${word}\\b`,
                            "i"
                        );

                    return pattern.test(text);

                });


            if (foundWord) {

                warning.textContent =
                    "Please remove inappropriate language from your feedback.";

                warning.style.display =
                    "inline";

            }

            else {

                warning.textContent =  
                    "";

                warning.style.display =
                    "none";

            }

        }
    );

}