/* =====================================================
   FACULTY DIRECTORY JAVASCRIPT
   FINAL REPLACEMENT VERSION
===================================================== */


// =====================================================
// GLOBAL DATA
// =====================================================

let allFaculty = [];

let studentDepartment = "";


// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "FACULTY DIRECTORY"
        );

        console.log(
            "Initializing..."
        );

        console.log(
            "========================================"
        );

        initializeFacultyDirectory();

    }
);


// =====================================================
// INITIALIZE
// =====================================================

async function initializeFacultyDirectory() {

    try {

        await loadStudentDepartment();

        await loadFaculty();

        setupSearch();

        console.log(
            "Faculty Directory initialized successfully."
        );

    }

    catch (error) {

        console.error(
            "Faculty Directory Error:",
            error
        );

        showError(
            error.message
        );

    }

}


// =====================================================
// LOAD STUDENT INFORMATION
// =====================================================

async function loadStudentDepartment() {

    console.log(
        "Requesting student information..."
    );


    try {

        const response =
            await fetch(
                "/student/student-info",
                {
                    credentials: "include"
                }
            );


        console.log(
            "Student information status:",
            response.status
        );


        if (!response.ok) {

            console.warn(
                "Student information request failed."
            );

            updateDepartmentHeading();

            return;

        }


        const data =
            await response.json();


        console.log(
            "Student information:",
            data
        );


        if (
            data &&
            data.student
        ) {

            studentDepartment =
                data.student.department ||
                "";

        }


        updateDepartmentHeading();

    }

    catch (error) {

        console.error(
            "Student information error:",
            error
        );

        updateDepartmentHeading();

    }

}


// =====================================================
// UPDATE DEPARTMENT HEADING
// =====================================================

function updateDepartmentHeading() {

    const element =
        document.getElementById(
            "department-name"
        );


    if (!element) {

        return;

    }


    if (
        studentDepartment &&
        studentDepartment.trim() !== ""
    ) {

        element.textContent =
            studentDepartment.trim() +
            " Department";

    }

    else {

        element.textContent =
            "Faculty Members";

    }

}


// =====================================================
// LOAD FACULTY
// =====================================================

async function loadFaculty() {

    const container =
        document.getElementById(
            "faculty-container"
        );


    console.log(
        "Requesting faculty directory..."
    );


    try {

        const response =
            await fetch(
                "/faculty-directory/",
                {
                    credentials: "include"
                }
            );


        console.log(
            "Faculty API status:",
            response.status
        );


        // =================================================
        // STUDENT NOT LOGGED IN
        // =================================================

        if (response.status === 401) {

            console.warn(
                "Student session not found."
            );


            window.location.href =
                "/auth/student.html";


            return;

        }


        // =================================================
        // OTHER SERVER ERRORS
        // =================================================

        if (!response.ok) {

            throw new Error(
                "Faculty directory request failed (" +
                response.status +
                ")."
            );

        }


        // =================================================
        // READ RESPONSE
        // =================================================

        const data =
            await response.json();


        console.log(
            "Faculty Directory Response:",
            data
        );


        // =================================================
        // GET FACULTY ARRAY
        // =================================================

        if (
            Array.isArray(
                data.faculty
            )
        ) {

            allFaculty =
                data.faculty;

        }

        else {

            allFaculty = [];

        }


        // =================================================
        // DEPARTMENT FALLBACK
        // =================================================

        if (
            !studentDepartment ||
            studentDepartment.trim() === ""
        ) {

            studentDepartment =
                data.department ||
                "";

        }


        updateDepartmentHeading();


        // =================================================
        // RENDER
        // =================================================

        renderFaculty(
            allFaculty
        );

    }

    catch (error) {

        console.error(
            "Faculty loading error:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="error-card">

                    <div style="
                        font-size: 32px;
                        margin-bottom: 12px;
                    ">
                        ⚠️
                    </div>

                    <strong>
                        Unable to load faculty
                    </strong>

                    <small>
                        ${escapeHTML(
                            error.message
                        )}
                    </small>

                </div>

            `;

        }

    }

}


// =====================================================
// RENDER FACULTY
// =====================================================

function renderFaculty(
    facultyList
) {

    const container =
        document.getElementById(
            "faculty-container"
        );


    if (!container) {

        console.error(
            "Faculty container not found."
        );

        return;

    }


    // =================================================
    // NO FACULTY
    // =================================================

    if (
        !Array.isArray(facultyList) ||
        facultyList.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-card">

                <div style="
                    font-size: 35px;
                    margin-bottom: 12px;
                ">
                    👨‍🏫
                </div>

                <strong>
                    No faculty members found
                </strong>

                <p style="
                    margin-top: 8px;
                    font-size: 13px;
                ">
                    There are currently no faculty
                    members available for your department.
                </p>

            </div>

        `;

        return;

    }


    // =================================================
    // CLEAR LOADING
    // =================================================

    container.innerHTML = "";


    // =================================================
    // CREATE CARDS
    // =================================================

    facultyList.forEach(
        faculty => {

            container.insertAdjacentHTML(
                "beforeend",
                createFacultyCard(
                    faculty
                )
            );

        }
    );


    // =================================================
    // SETUP FEEDBACK BUTTONS
    // =================================================

    setupFeedbackButtons();

}


// =====================================================
// CREATE FACULTY CARD
// =====================================================

function createFacultyCard(
    faculty
) {

    // =================================================
    // NAME
    // =================================================

    const rawName =
        faculty.name ||
        faculty.faculty_name ||
        faculty.full_name ||
        "Unknown Faculty";


    const name =
        escapeHTML(
            rawName
        );


    // =================================================
    // DEPARTMENT
    // =================================================

    const rawDepartment =
        faculty.department ||
        faculty.faculty_department ||
        faculty.department_name ||
        studentDepartment ||
        "Department Not Available";


    const department =
        escapeHTML(
            rawDepartment
        );


    // =================================================
    // EMAIL
    // =================================================

    const rawEmail =
        faculty.email ||
        faculty.faculty_email ||
        "Email Not Available";


    const email =
        escapeHTML(
            rawEmail
        );


    // =================================================
    // FACULTY ID
    // =================================================

    const facultyId =
        faculty.faculty_id ||
        faculty.id ||
        faculty.facultyId ||
        "";


    // =================================================
    // CARD
    // =================================================

    return `

        <article
            class="faculty-card"
            data-name="${name.toLowerCase()}"
            data-faculty-id="${escapeHTML(facultyId)}"
        >


            <!-- CARD HEADER -->

            <div class="faculty-card-header">


                <div class="faculty-avatar">

                    👨‍🏫

                </div>


                <div class="faculty-title">

                    <h3>
                        ${name}
                    </h3>

                    <span>
                        Faculty Member
                    </span>

                </div>


            </div>



            <!-- FACULTY DETAILS -->

            <div class="faculty-details">


                <!-- DEPARTMENT -->

                <div class="faculty-detail">

                    <span class="detail-icon">
                        🏢
                    </span>

                    <div>

                        <small>
                            Department
                        </small>

                        <strong>
                            ${department}
                        </strong>

                    </div>

                </div>



                <!-- EMAIL -->

                <div class="faculty-detail">

                    <span class="detail-icon">
                        📧
                    </span>

                    <div>

                        <small>
                            Email
                        </small>

                        <strong>
                            ${email}
                        </strong>

                    </div>

                </div>


            </div>



            <!-- CARD FOOTER -->

            <div class="faculty-card-footer">


                <span class="anonymous-label">

                    🔒 Anonymous Feedback

                </span>


                <button
                    type="button"
                    class="feedback-button"
                    data-faculty-id="${escapeHTML(facultyId)}"
                >

                    Give Feedback →

                </button>


            </div>


        </article>

    `;

}


// =====================================================
// SETUP FEEDBACK BUTTONS
// =====================================================

function setupFeedbackButtons() {

    const buttons =
        document.querySelectorAll(
            ".feedback-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const facultyId =
                        button.dataset.facultyId;


                    openFeedback(
                        facultyId
                    );

                }
            );

        }
    );

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const input =
        document.getElementById(
            "faculty-search"
        );


    if (!input) {

        console.warn(
            "Faculty search input not found."
        );

        return;

    }


    input.addEventListener(
        "input",
        () => {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            const cards =
                document.querySelectorAll(
                    ".faculty-card"
                );


            let visibleCount =
                0;


            cards.forEach(
                card => {

                    const name =
                        card.dataset.name ||
                        "";


                    const matches =
                        name.includes(
                            query
                        );


                    if (matches) {

                        card.style.display =
                            "";

                        visibleCount++;

                    }

                    else {

                        card.style.display =
                            "none";

                    }

                }
            );


            showSearchMessage(
                visibleCount,
                query
            );

        }
    );

}


// =====================================================
// SEARCH EMPTY MESSAGE
// =====================================================

function showSearchMessage(
    count,
    query
) {

    const oldMessage =
        document.getElementById(
            "search-empty"
        );


    if (oldMessage) {

        oldMessage.remove();

    }


    if (
        !query ||
        count > 0
    ) {

        return;

    }


    const container =
        document.getElementById(
            "faculty-container"
        );


    if (!container) {

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.id =
        "search-empty";


    message.className =
        "empty-card";


    message.innerHTML = `

        <div style="
            font-size: 30px;
            margin-bottom: 10px;
        ">
            🔍
        </div>

        <strong>
            No faculty member found
        </strong>

        <p style="
            margin-top: 8px;
            font-size: 13px;
        ">
            No faculty matches
            "${escapeHTML(query)}".
        </p>

    `;


    container.appendChild(
        message
    );

}


// =====================================================
// OPEN FEEDBACK
// =====================================================

function openFeedback(
    facultyId
) {

    console.log(
        "Opening feedback for faculty:",
        facultyId
    );


    if (!facultyId) {

        console.error(
            "Faculty ID is missing."
        );


        alert(
            "Faculty information is incomplete."
        );


        return;

    }


    /*
     * IMPORTANT
     *
     * feedback.html is located at:
     *
     * public/feedback.html
     *
     * Therefore the browser URL is:
     *
     * /feedback.html
     *
     * NOT:
     *
     * /dashboard/feedback.html
     */

    const feedbackURL =
        "/feedback.html?faculty_id=" +
        encodeURIComponent(
            facultyId
        );


    console.log(
        "Redirecting to:",
        feedbackURL
    );


    window.location.href =
        feedbackURL;

}


// =====================================================
// ERROR DISPLAY
// =====================================================

function showError(
    message
) {

    const container =
        document.getElementById(
            "faculty-container"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="error-card">

            <div style="
                font-size: 32px;
                margin-bottom: 12px;
            ">
                ⚠️
            </div>

            <strong>
                Unable to load faculty
            </strong>

            <small>
                ${escapeHTML(
                    message ||
                    "Unknown server error."
                )}
            </small>

        </div>

    `;

}


// =====================================================
// ESCAPE HTML
// =====================================================

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


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.openFeedback =
    openFeedback;


window.loadFaculty =
    loadFaculty;


console.log(
    "faculty-directory.js loaded successfully."
);