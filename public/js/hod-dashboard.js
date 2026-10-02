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

document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupHODCreateCycle();
    loadCycles();

        setupFilters();

        setupLogout();

        loadHODInfo();

        loadDashboard();
        loadMissingStudents();
        loadMessages();

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

// ==========================================
// HOD CYCLE LOGIC
// ==========================================

function formatCycleDate(dateStr) {
    if (!dateStr) return "--";
    try {
        const d = new Date(dateStr);
        return isNaN(d) ? dateStr : d.toLocaleDateString();
    } catch {
        return dateStr;
    }
}

function showHODCycleMsg(message, type) {
    const el = document.getElementById("hod-cycle-msg");
    if (!el) return;
    el.textContent = message;
    el.className = type === "error" ? "cycle-message-error" : "cycle-message-success";
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 6000);
}

window.hodActivateCycle = async function hodActivateCycle(id, name) {
    if (!confirm(`Activate cycle "${name}"?\nThis will deactivate any currently active cycle.`)) return;
    try {
        const res = await fetch(`/hod/cycles/${id}/activate`, { method: "POST", credentials: "same-origin" });
        const data = await res.json();
        if (data.success) {
            showHODCycleMsg("✅ Cycle activated: " + name, "success");
            loadCycles();
        } else {
            showHODCycleMsg(data.message || "Failed to activate.", "error");
        }
    } catch (err) {
        showHODCycleMsg("Network error.", "error");
    }
}

window.hodEndCycle = async function hodEndCycle(id, name) {
    if (!confirm(`End cycle "${name}"?\nStudents will no longer be able to submit feedback.`)) return;
    try {
        const res = await fetch(`/hod/cycles/${id}/end`, { method: "POST", credentials: "same-origin" });
        const data = await res.json();
        if (data.success) {
            showHODCycleMsg("✅ Cycle ended: " + name, "success");
            loadCycles();
        } else {
            showHODCycleMsg(data.message || "Failed to end cycle.", "error");
        }
    } catch (err) {
        showHODCycleMsg("Network error.", "error");
    }
}

async function loadCycles() {
    const container = document.getElementById("cycles-list");
    if (!container) return;
    
    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>Loading...</span></div>`;
    
    try {
        const response = await fetch("/hod/cycles", { method: "GET", credentials: "same-origin" });
        if (response.status === 401) { redirectToHODLogin(); return; }
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            container.innerHTML = `<div class="empty-state"><p>${escapeHTML(data.message || "Failed to load cycles.")}</p></div>`;
            return;
        }
        
        const cycles = data.cycles || [];
        if (cycles.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>No Cycles Yet</h3><p>Use the form above to create the first feedback cycle.</p></div>`;
            return;
        }
        
        const rows = cycles.map(c => {
            const isActive = c.status === "active";
            const actionBtn = isActive
                ? `<button class="end-btn hod-cycle-action-btn" data-action="end" data-id="${c.id}" data-name="${escapeHTML(c.name)}" type="button">⏹ End</button>`
                : `<button class="activate-btn hod-cycle-action-btn" data-action="activate" data-id="${c.id}" data-name="${escapeHTML(c.name)}" type="button">▶ Activate</button>`;
                
            return `
                <tr>
                    <td>${escapeHTML(c.name)}</td>
                    <td>${formatCycleDate(c.start_date)}</td>
                    <td>${formatCycleDate(c.end_date)}</td>
                    <td><span class="type-badge ${isActive ? 'badge-congrat' : 'badge-improve'}">${isActive ? '🟢 Active' : '⚪ Inactive'}</span></td>
                    <td>${actionBtn} <button class="end-btn hod-cycle-action-btn" style="background:#ef4444;margin-left:5px" data-action="delete" data-id="${c.id}" data-name="${escapeHTML(c.name)}" type="button">🗑 Delete</button></td>
                </tr>
            `;
        }).join("");
        
        container.innerHTML = `
            <table class="hod-table">
                <thead>
                    <tr>
                        <th>Cycle Name</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
        
        document.querySelectorAll('.hod-cycle-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                if (action === 'activate') window.hodActivateCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
                if (action === 'end') window.hodEndCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
                if (action === 'delete') window.hodDeleteCycle(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
            });
        });
        
    } catch (err) {
        console.error("Load cycles error:", err);
        container.innerHTML = `<div class="empty-state"><p>Network error. Please try again.</p></div>`;
    }
}

function setupHODCreateCycle() {
    const btn = document.getElementById("hod-create-cycle-btn");
    if (!btn) return;
    
    btn.addEventListener("click", async () => {
        const name = document.getElementById("hod-cycle-name")?.value.trim();
        const start = document.getElementById("hod-cycle-start")?.value;
        const end = document.getElementById("hod-cycle-end")?.value;
        
        if (!name || !start || !end) {
            showHODCycleMsg("Please fill all fields.", "error");
            return;
        }
        if (end < start) {
            showHODCycleMsg("End date cannot be before start date.", "error");
            return;
        }
        
        btn.disabled = true;
        btn.textContent = "Creating…";
        
        try {
            const res = await fetch("/hod/cycles/create", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, start_date: start, end_date: end })
            });
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                showHODCycleMsg(data.message || "Failed to create cycle.", "error");
            } else {
                showHODCycleMsg("✅ Cycle created: " + data.cycle.name, "success");
                document.getElementById("hod-cycle-name").value = "";
                document.getElementById("hod-cycle-start").value = "";
                document.getElementById("hod-cycle-end").value = "";
                loadCycles();
            }
        } catch (err) {
            showHODCycleMsg("Network error. Please try again.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Create Cycle";
        }
    });
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
}

window.hodDeleteCycle = async function(id, name) {
    if (!confirm(`Delete cycle "${name}" permanently?`)) return;
    try {
        const res = await fetch(`/hod/cycles/${id}`, { method: "DELETE", credentials: "same-origin" });
        const data = await res.json();
        if (data.success) { showHODCycleMsg("✅ Deleted: " + name, "success"); loadCycles(); }
        else showHODCycleMsg(data.message || "Failed to delete.", "error");
    } catch { showHODCycleMsg("Network error.", "error"); }
};


/* =========================================================
   MISSING STUDENTS
========================================================= */

async function loadMissingStudents() {
    const container = document.getElementById("missing-list");
    const countEl = document.getElementById("missing-count");
    if (!container) return;
    
    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>Loading students...</span></div>`;
    
    try {
        const response = await fetch("/hod/missing-students", { method: "GET", credentials: "same-origin" });
        if (response.status === 401) { redirectToHODLogin(); return; }
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            container.innerHTML = `<div class="empty-state"><p>${escapeHTML(data.message || "Failed to load missing students.")}</p></div>`;
            return;
        }
        
        const missing = data.missingStudents || [];
        if (countEl) countEl.textContent = missing.length;
        
        if (missing.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>All Caught Up!</h3><p>All students have submitted their feedback.</p></div>`;
            return;
        }
        
        const rows = missing.map(s => `
            <tr>
                <td>${escapeHTML(s.student_id)}</td>
                <td>${escapeHTML(s.name)}</td>
                <td>${escapeHTML(String(s.year))}</td>
                <td>${escapeHTML(s.division)}</td>
            </tr>
        `).join("");
        
        container.innerHTML = `
            <table class="hod-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Year</th>
                        <th>Division</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
        
    } catch (err) {
        console.error("Missing students error:", err);
        container.innerHTML = `<div class="empty-state"><p>Network error.</p></div>`;
    }
}

/* =========================================================
   SENT MESSAGES
========================================================= */

async function loadMessages() {
    const container = document.getElementById("replies-list");
    if (!container) return;
    
    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>Loading messages...</span></div>`;
    
    try {
        const response = await fetch("/hod/auto-replies", { method: "GET", credentials: "same-origin" });
        if (response.status === 401) { redirectToHODLogin(); return; }
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            container.innerHTML = `<div class="empty-state"><p>${escapeHTML(data.message || "Failed to load messages.")}</p></div>`;
            return;
        }
        
        const msgs = data.messages || [];
        if (msgs.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>No Messages Sent</h3><p>You haven't sent any auto-replies yet.</p></div>`;
            return;
        }
        
        const rows = msgs.map(m => {
            const isCongrats = m.type === "congratulate";
            const badge = isCongrats ? `<span class="type-badge badge-congrat">🎉 Congratulate</span>` : `<span class="type-badge badge-improve">📈 Improve</span>`;
            return `
                <tr>
                    <td>${escapeHTML(m.faculty_name)}</td>
                    <td>${escapeHTML(m.faculty_id)}</td>
                    <td>${badge}</td>
                    <td>${formatCycleDate(m.sent_at)}</td>
                </tr>
            `;
        }).join("");
        
        container.innerHTML = `
            <table class="hod-table">
                <thead>
                    <tr>
                        <th>Faculty Name</th>
                        <th>Faculty ID</th>
                        <th>Type</th>
                        <th>Sent Date</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
        
    } catch (err) {
        console.error("Messages error:", err);
        container.innerHTML = `<div class="empty-state"><p>Network error.</p></div>`;
    }
}
