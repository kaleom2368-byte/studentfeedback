/* =========================================================
   HOD DASHBOARD
   Anonymous Student Feedback System
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let hodData = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupFilters();

        setupLogout();

        loadHODInfo();

        loadDashboard();

    }
);


/* =========================================================
   LOAD HOD INFORMATION
========================================================= */

async function loadHODInfo() {

    try {

        const response =
            await fetch("/hod/info", {
                method: "GET",
                credentials: "same-origin"
            });


        if (response.status === 401) {

            redirectToHODLogin();

            return;

        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            console.error(
                data.message ||
                "Unable to load HOD information."
            );

            redirectToHODLogin();

            return;

        }


        if (!data.hod) {

            console.error(
                "HOD information is missing."
            );

            return;

        }


        setText(
            "hod-name",
            data.hod.name || "HOD"
        );


        setText(
            "hod-department",
            data.hod.department ||
            "Department not available"
        );


        setText(
            "hod-id",
            data.hod.hod_id || "--"
        );

    }

    catch (error) {

        console.error(
            "HOD information error:",
            error
        );

    }

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch("/hod/dashboard", {
                method: "GET",
                credentials: "same-origin"
            });


        if (response.status === 401) {

            redirectToHODLogin();

            return;

        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            console.error(
                data.message ||
                "Unable to load HOD dashboard."
            );

            showDashboardError(
                data.message ||
                "Unable to load dashboard data."
            );

            return;

        }


        hodData = data;


        updateStatistics(data);

        updateRecognition(data);

        renderFacultyList();

    }

    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        showDashboardError(
            "Unable to connect to the server."
        );

    }

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics(data) {

    const facultyList =
        Array.isArray(data.facultyList)
            ? data.facultyList
            : [];


    setText(
        "total-faculties",
        facultyList.length
    );


    setText(
        "total-feedback",
        Number(
            data.totalFeedback || 0
        )
    );


    setText(
        "department-average",
        Number(
            data.averageRating || 0
        ).toFixed(1)
    );


    /*
       This will initially show the number of
       faculty members with feedback after the
       individual analysis requests finish.
    */

    setText(
        "faculty-with-feedback",
        "0"
    );

}


/* =========================================================
   UPDATE TOP / LOWEST FACULTY
========================================================= */

function updateRecognition(data) {

    /* ================= TOP ================= */

    if (data.bestFaculty) {

        setText(
            "best-faculty-name",
            data.bestFaculty.name || "--"
        );


        setText(
            "best-faculty-rating",
            "Rating: " +
            Number(
                data.bestFaculty.rating || 0
            ).toFixed(1) +
            " / 5"
        );

    }

    else {

        setText(
            "best-faculty-name",
            "--"
        );


        setText(
            "best-faculty-rating",
            "Rating: --"
        );

    }


    /* ================= LOWEST ================= */

    if (data.lowestFaculty) {

        setText(
            "lowest-faculty-name",
            data.lowestFaculty.name || "--"
        );


        setText(
            "lowest-faculty-rating",
            "Rating: " +
            Number(
                data.lowestFaculty.rating || 0
            ).toFixed(1) +
            " / 5"
        );

    }

    else {

        setText(
            "lowest-faculty-name",
            "--"
        );


        setText(
            "lowest-faculty-rating",
            "Rating: --"
        );

    }

}


/* =========================================================
   RENDER FACULTY LIST
========================================================= */

function renderFacultyList() {

    if (!hodData) {
        return;
    }


    const container =
        document.getElementById(
            "faculty-list"
        );


    if (!container) {
        return;
    }


    const yearFilter =
        document.getElementById(
            "year-filter"
        );


    const divisionFilter =
        document.getElementById(
            "division-filter"
        );


    const selectedYear =
        yearFilter
            ? yearFilter.value
            : "all";


    const selectedDivision =
        divisionFilter
            ? divisionFilter.value
            : "all";


    const facultyList =
        Array.isArray(hodData.facultyList)
            ? hodData.facultyList
            : [];


    const faculties =
        facultyList.filter(
            faculty => {

                const yearMatch =
                    selectedYear === "all" ||
                    String(
                        faculty.year ?? ""
                    ) === selectedYear;


                const divisionMatch =
                    selectedDivision === "all" ||
                    String(
                        faculty.division ?? ""
                    ).toUpperCase() ===
                    selectedDivision.toUpperCase();


                return (
                    yearMatch &&
                    divisionMatch
                );

            }
        );


    setText(
        "faculty-count",
        `${faculties.length} Faculties`
    );


    /* ================= EMPTY ================= */

    if (faculties.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Faculty Found
                </h3>

                <p>
                    No faculty members match the
                    selected year and division.
                </p>

            </div>

        `;


        setText(
            "faculty-with-feedback",
            "0"
        );


        return;

    }


    /* ================= FACULTY ROWS ================= */

    container.innerHTML =
        faculties
            .map(
                faculty =>
                    createFacultyRow(
                        faculty
                    )
            )
            .join("");


    /* ================= EVENTS ================= */

    container
        .querySelectorAll(
            ".analysis-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const facultyId =
                            button.dataset.facultyId;


                        if (!facultyId) {

                            return;

                        }


                        openFacultyAnalysis(
                            facultyId
                        );

                    }
                );

            }
        );


    updateFacultyFeedbackCount(
        faculties
    );

}


/* =========================================================
   CREATE FACULTY ROW
========================================================= */

function createFacultyRow(
    faculty
) {

    const name =
        String(
            faculty.name || "Unknown Faculty"
        );


    const facultyId =
        String(
            faculty.faculty_id || "--"
        );


    const division =
        String(
            faculty.division || "--"
        );


    const year =
        formatYear(
            faculty.year
        );


    const initials =
        getInitials(name);


    return `

        <div class="faculty-row">

            <div class="faculty-info">

                <div class="faculty-avatar">
                    ${escapeHTML(initials)}
                </div>


                <div>

                    <h4>
                        ${escapeHTML(name)}
                    </h4>

                    <p>
                        ${escapeHTML(facultyId)}
                    </p>

                </div>

            </div>


            <div class="faculty-meta">

                <span>
                    ${escapeHTML(year)}
                </span>

                <span>
                    Division
                    ${escapeHTML(division)}
                </span>

            </div>


            <button
                class="analysis-btn"
                type="button"
                data-faculty-id="${escapeHTML(
                    facultyId
                )}"
            >
                View Analysis
            </button>

        </div>

    `;

}


/* =========================================================
   UPDATE FACULTY FEEDBACK COUNT
========================================================= */

async function updateFacultyFeedbackCount(
    faculties
) {

    let count = 0;


    /*
       Request each faculty's analysis endpoint.

       This keeps the dashboard compatible with
       your current backend instead of requiring
       a new API route.
    */

    const requests =
        faculties.map(
            async faculty => {

                try {

                    const facultyId =
                        faculty.faculty_id;


                    if (!facultyId) {
                        return false;
                    }


                    const response =
                        await fetch(
                            `/hod/faculty/${encodeURIComponent(
                                facultyId
                            )}/analysis`,
                            {
                                method: "GET",
                                credentials: "same-origin"
                            }
                        );


                    if (!response.ok) {

                        return false;

                    }


                    const data =
                        await response.json();


                    return (
                        data.success === true &&
                        Number(
                            data.totalFeedback || 0
                        ) > 0
                    );

                }

                catch (error) {

                    console.error(
                        "Faculty analysis error:",
                        error
                    );


                    return false;

                }

            }
        );


    const results =
        await Promise.all(
            requests
        );


    count =
        results.filter(
            Boolean
        ).length;


    setText(
        "faculty-with-feedback",
        count
    );

}


/* =========================================================
   OPEN FACULTY ANALYSIS
========================================================= */

function openFacultyAnalysis(
    facultyId
) {

    if (!facultyId) {
        return;
    }


    window.location.href =
        `/dashboard/hod-faculty-analysis.html?faculty=${encodeURIComponent(
            facultyId
        )}`;

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logout-btn"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        logoutHOD
    );

}


function logoutHOD() {

    window.location.href =
        "/hod/logout";

}


/* =========================================================
   FILTER SETUP
========================================================= */

function setupFilters() {

    const yearFilter =
        document.getElementById(
            "year-filter"
        );


    const divisionFilter =
        document.getElementById(
            "division-filter"
        );


    if (yearFilter) {

        yearFilter.addEventListener(
            "change",
            renderFacultyList
        );

    }


    if (divisionFilter) {

        divisionFilter.addEventListener(
            "change",
            renderFacultyList
        );

    }

}


/* =========================================================
   FORMAT YEAR
========================================================= */

function formatYear(
    year
) {

    const value =
        Number(year);


    switch (value) {

        case 1:
            return "1st Year";

        case 2:
            return "2nd Year";

        case 3:
            return "3rd Year";

        case 4:
            return "4th Year";

        default:
            return `${year ?? "--"} Year`;

    }

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    const words =
        String(
            name || ""
        )
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (words.length === 0) {
        return "--";
    }


    return words
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setText(
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


    element.textContent =
        String(
            value ?? ""
        );

}


/* =========================================================
   LOGIN REDIRECT
========================================================= */

function redirectToHODLogin() {

    window.location.href =
        "/auth/hodfile.html";

}


/* =========================================================
   DASHBOARD ERROR
========================================================= */

function showDashboardError(
    message
) {

    const container =
        document.getElementById(
            "faculty-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-state">

            <h3>
                Unable to Load Dashboard
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}