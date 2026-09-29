"use strict";

/*
 * FACULTY DASHBOARD
 * Simplified + compatible with current PostgreSQL backend
 */

let chart = null;
let data = null;
let refreshTimer = null;
let refreshing = false;

const REFRESH_MS = 10000;

const PARAMETERS = [
    ["course_satisfaction", "Course Satisfaction"],
    ["syllabus_pace", "Syllabus Pace"],
    ["concept_clarity", "Concept Clarity"],
    ["practical_work", "Practical Work"],
    ["study_material", "Study Material"],
    ["exam_difficulty", "Exam Difficulty"],
    ["faculty_support", "Faculty Support"],
    ["improvement", "Improvement"]
];

/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initFilters();
    initChecklist();

    await loadFaculty();
    await loadFeedback();

    startRefresh();
});

/* =========================================================
   BASIC HELPERS
========================================================= */

const $ = id => document.getElementById(id);

function setText(id, value, fallback = "—") {
    const element = $(id);

    if (!element) return;

    element.textContent =
        value === undefined ||
        value === null ||
        value === ""
            ? fallback
            : String(value);
}

function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function rating(value) {
    return num(value).toFixed(1);
}

function average(values) {
    const valid = values
        .map(num)
        .filter(value => value > 0);

    if (!valid.length) return 0;

    return valid.reduce(
        (sum, value) => sum + value,
        0
    ) / valid.length;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncate(value, length = 400) {
    const text = String(value ?? "").trim();

    return text.length > length
        ? text.slice(0, length - 1) + "…"
        : text;
}

function css(variable) {
    return getComputedStyle(document.body)
        .getPropertyValue(variable)
        .trim();
}

async function apiGet(url) {
    const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json"
        }
    });

    if (response.status === 401) {
        window.location.href = "/auth/faculty.html";
        throw new Error("Faculty session expired");
    }

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

/* =========================================================
   THEME
========================================================= */

function initTheme() {
    const button = $("dark-mode-btn");

    if (!button) return;

    const saved =
        localStorage.getItem("facultyTheme") || "dark";

    applyTheme(saved);

    button.addEventListener("click", () => {
        const current =
            document.documentElement.dataset.theme === "light"
                ? "light"
                : "dark";

        applyTheme(
            current === "light"
                ? "dark"
                : "light"
        );
    });
}

function applyTheme(theme) {
    const light = theme === "light";
    const html = document.documentElement;
    const body = document.body;
    const button = $("dark-mode-btn");

    html.dataset.theme = light ? "light" : "dark";

    html.classList.toggle("light", light);
    html.classList.toggle("dark", !light);

    body.classList.toggle("light-mode", light);
    body.classList.toggle("dark-mode", !light);

    localStorage.setItem(
        "facultyTheme",
        light ? "light" : "dark"
    );

    if (button) {
        button.textContent = light ? "🌙" : "☀️";
        button.title = light
            ? "Switch to dark mode"
            : "Switch to light mode";
    }

    updateChartTheme();
}

/* =========================================================
   FACULTY
========================================================= */

async function loadFaculty() {
    try {
        const result = await apiGet("/faculty/info");

        if (!result || result.success === false) return;

        const faculty =
            result.faculty ||
            result.data ||
            result;

        const id =
            faculty.faculty_id ||
            faculty.facultyId ||
            faculty.id ||
            "—";

        const name =
            faculty.name ||
            faculty.faculty_name ||
            "Faculty";

        const department =
            faculty.department ||
            faculty.dept ||
            "—";

        const email =
            faculty.email ||
            faculty.faculty_email ||
            "—";

        const subject = Array.isArray(faculty.subjects)
            ? faculty.subjects.join(", ")
            : (
                faculty.subject ||
                faculty.subject_name ||
                faculty.subjects ||
                "—"
            );

        setText("faculty-id", id);
        setText("faculty-name", name);
        setText("faculty-department", department);
        setText("faculty-email", email);
        setText("faculty-subject", subject);

        setText("faculty-name-header", name);
        setText("faculty-department-header", department);

        setText(
            "welcome-heading",
            `Welcome back, ${name} 👋`
        );

        setText(
            "welcome-sub",
            `${subject} • ${department}`
        );

    } catch (error) {
        console.error("Faculty information error:", error);
    }
}

/* =========================================================
   FEEDBACK
========================================================= */

async function loadFeedback() {
    try {
        const result =
            await apiGet("/faculty/feedback");

        data = result;

        console.log(
            "Faculty dashboard:",
            result
        );

        if (!result || result.success === false) {
            showNoFeedback();
            return;
        }

        const cycle = activeCycle();
        const cycles = getCycles();

        const ratings = getRatings(
            result.averages ||
            result.ratings ||
            result.statistics ||
            result.stats ||
            {}
        );

        const total =
            num(
                result.totalFeedback
            ) ||
            num(
                result.feedbackCount
            ) ||
            num(
                cycle?.count
            ) ||
            getFeedbackCount();

        const responses =
            num(
                result.participation?.submitted
            ) ||
            num(
                result.participation?.submittedCurrent
            ) ||
            total;

        setText(
            "overall-rating",
            rating(
                result.overall ||
                result.overallRating ||
                average(Object.values(ratings))
            )
        );

        setText(
            "total-feedback",
            total,
            "0"
        );

        setText(
            "cycle-responses",
            responses,
            "0"
        );

        const cycleName =
            getCycleName(cycle);

        setText(
            "cycle-label",
            cycleName
        );

        setText(
            "cycle-label-small",
            cycleName
        );

        renderRatings(ratings);
        renderChart(cycles);
        renderHistory(cycles);
        renderParticipation(result.participation);
        renderInsights(ratings, cycle);
        renderComments(
            result.feedback ||
            result.recentFeedback ||
            []
        );

    } catch (error) {
        console.error(
            "Faculty feedback error:",
            error
        );

        showFeedbackError();
    }
}

/* =========================================================
   CYCLES
========================================================= */

function activeCycle() {
    if (!data) return null;

    if (
        data.activeCycle &&
        typeof data.activeCycle === "object"
    ) {
        return data.activeCycle;
    }

    if (
        data.currentCycle &&
        typeof data.currentCycle === "object"
    ) {
        return data.currentCycle;
    }

    return getCycles().find(
        cycle =>
            String(cycle.status || "")
                .toLowerCase() === "active"
    ) || null;
}

function getCycles() {
    if (!data) return [];

    const cycles =
        data.cycles ||
        data.history ||
        data.months ||
        data.monthlyTrend ||
        [];

    return Array.isArray(cycles)
        ? cycles
        : [];
}

function getCycleName(cycle) {
    return (
        cycle?.name ||
        cycle?.label ||
        cycle?.cycle_name ||
        "No Active Cycle"
    );
}

function getCycleId(cycle) {
    return (
        cycle?.id ??
        cycle?.cycle_id ??
        cycle?.cycleId ??
        null
    );
}

function getFeedbackCount() {
    if (!data) return 0;

    const list =
        data.feedback ||
        data.recentFeedback ||
        [];

    return Array.isArray(list)
        ? list.length
        : 0;
}

/* =========================================================
   RATINGS
========================================================= */

function getRatings(source) {
    const result = {};

    for (const [key] of PARAMETERS) {
        result[key] = findRating(
            source,
            key
        );
    }

    return result;
}

function findRating(source, key) {
    if (!source) return 0;

    const aliases = {
        course_satisfaction: [
            "course_satisfaction",
            "courseSatisfaction",
            "course"
        ],

        syllabus_pace: [
            "syllabus_pace",
            "syllabusPace",
            "pace"
        ],

        concept_clarity: [
            "concept_clarity",
            "conceptClarity",
            "clarity"
        ],

        practical_work: [
            "practical_work",
            "practicalWork",
            "practical"
        ],

        study_material: [
            "study_material",
            "studyMaterial",
            "material"
        ],

        exam_difficulty: [
            "exam_difficulty",
            "examDifficulty",
            "exam"
        ],

        faculty_support: [
            "faculty_support",
            "facultySupport",
            "support"
        ],

        improvement: [
            "improvement"
        ]
    };

    for (const name of aliases[key] || [key]) {
        const value = num(source[name]);

        if (value > 0) {
            return value;
        }
    }

    return 0;
}

/* =========================================================
   RATING BREAKDOWN
========================================================= */

function renderRatings(ratings) {
    const container =
        $("rating-breakdown");

    if (!container) return;

    const rows = PARAMETERS.map(
        ([key, label]) => ({
            label,
            value: num(ratings[key])
        })
    );

    if (!rows.some(row => row.value > 0)) {
        container.innerHTML = `
            <div class="loading-card">
                No rating data available yet.
            </div>
        `;
        return;
    }

    container.innerHTML = rows.map(row => {
        const value = Math.min(
            5,
            Math.max(0, row.value)
        );

        const percent =
            Math.round((value / 5) * 100);

        return `
            <div class="breakdown-row">
                <div class="breakdown-label">
                    ${escapeHtml(row.label)}
                </div>

                <div class="breakdown-bar">
                    <div
                        class="breakdown-fill"
                        style="width:${percent}%">
                    </div>
                </div>

                <div class="breakdown-value">
                    ${value.toFixed(1)}
                </div>
            </div>
        `;
    }).join("");
}

/* =========================================================
   CHART
========================================================= */

function renderChart(cycles) {
    const canvas =
        $("perfTrendChart");

    if (!canvas ||
        typeof Chart === "undefined") {
        return;
    }

    if (chart) {
        chart.destroy();
    }

    const labels = cycles.map(
        getCycleName
    );

    const values = cycles.map(
        getCycleOverall
    );

    chart = new Chart(canvas, {
        type: "line",

        data: {
            labels,

            datasets: [{
                label: "Overall Rating",
                data: values,

                borderColor:
                    css("--accent"),

                backgroundColor:
                    "rgba(79,141,247,0.08)",

                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,

                pointBackgroundColor:
                    css("--accent"),

                tension: 0.25,
                fill: true
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor:
                        css("--surface"),

                    titleColor:
                        css("--text"),

                    bodyColor:
                        css("--text-secondary"),

                    borderColor:
                        css("--border"),

                    borderWidth: 1
                }
            },

            scales: {
                y: {
                    min: 0,
                    max: 5,

                    ticks: {
                        stepSize: 1,
                        color:
                            css("--text-muted")
                    },

                    grid: {
                        color:
                            css("--border")
                    }
                },

                x: {
                    ticks: {
                        color:
                            css("--text-muted")
                    },

                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function getCycleOverall(cycle) {
    const direct =
        num(cycle?.overall) ||
        num(cycle?.overallRating) ||
        num(cycle?.overallAverage) ||
        num(cycle?.average);

    if (direct > 0) {
        return direct;
    }

    return average(
        Object.values(
            getRatings(cycle)
        )
    );
}

function updateChartTheme() {
    if (!chart) return;

    chart.options.scales.x.ticks.color =
        css("--text-muted");

    chart.options.scales.y.ticks.color =
        css("--text-muted");

    chart.options.scales.y.grid.color =
        css("--border");

    chart.data.datasets[0].borderColor =
        css("--accent");

    chart.data.datasets[0].pointBackgroundColor =
        css("--accent");

    chart.options.plugins.tooltip.backgroundColor =
        css("--surface");

    chart.options.plugins.tooltip.titleColor =
        css("--text");

    chart.options.plugins.tooltip.bodyColor =
        css("--text-secondary");

    chart.options.plugins.tooltip.borderColor =
        css("--border");

    chart.update("none");
}

/* =========================================================
   HISTORY
========================================================= */

function renderHistory(cycles) {
    const container =
        $("monthly-table");

    if (!container) return;

    if (!cycles.length) {
        container.innerHTML = `
            <div class="loading-card">
                No feedback cycles available.
            </div>
        `;
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Cycle</th>
                    <th>Status</th>
                    <th>Responses</th>
                    <th>Overall</th>

                    ${PARAMETERS.map(
                        ([, label]) =>
                            `<th>${escapeHtml(label)}</th>`
                    ).join("")}

                    <th>Trend</th>
                </tr>
            </thead>

            <tbody>
    `;

    cycles.forEach((cycle, index) => {
        const ratings =
            getRatings(cycle);

        const overall =
            getCycleOverall(cycle);

        const responses =
            num(cycle.count) ||
            num(cycle.responses) ||
            num(cycle.feedbackCount) ||
            num(cycle.totalResponses) ||
            0;

        const status =
            cycle.status
                ? capitalize(cycle.status)
                : "—";

        html += `
            <tr>
                <td>
                    ${escapeHtml(
                        getCycleName(cycle)
                    )}
                </td>

                <td>
                    ${escapeHtml(status)}
                </td>

                <td>${responses}</td>

                <td>${rating(overall)}</td>

                ${PARAMETERS.map(
                    ([key]) =>
                        `<td>${rating(
                            ratings[key]
                        )}</td>`
                ).join("")}

                <td>
                    ${escapeHtml(
                        trend(cycles, index)
                    )}
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function trend(cycles, index) {
    if (index >= cycles.length - 1) {
        return "—";
    }

    const current =
        getCycleOverall(cycles[index]);

    const previous =
        getCycleOverall(cycles[index + 1]);

    if (!current || !previous) {
        return "—";
    }

    const difference =
        current - previous;

    if (Math.abs(difference) < 0.05) {
        return "—";
    }

    return difference > 0
        ? `▲ ${difference.toFixed(1)}`
        : `▼ ${Math.abs(difference).toFixed(1)}`;
}

/* =========================================================
   FILTERS
========================================================= */

function initFilters() {
    document
        .querySelectorAll(".filter")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(".filter")
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add("active");

                    const cycles =
                        getCycles();

                    const period =
                        button.dataset.period;

                    if (period === "current") {
                        const cycle =
                            activeCycle();

                        renderHistory(
                            cycle ? [cycle] : []
                        );

                        return;
                    }

                    if (period === "previous") {
                        const active =
                            activeCycle();

                        const activeId =
                            getCycleId(active);

                        renderHistory(
                            cycles
                                .filter(
                                    cycle =>
                                        getCycleId(cycle) !==
                                        activeId
                                )
                                .slice(0, 1)
                        );

                        return;
                    }

                    renderHistory(cycles);
                }
            );
        });
}

/* =========================================================
   PARTICIPATION
========================================================= */

function renderParticipation(participation = {}) {
    const container =
        $("participation");

    if (!container) return;

    const students =
        Array.isArray(participation.students)
            ? participation.students
            : [];

    const total =
        num(participation.eligible) ||
        num(participation.totalStudents) ||
        num(participation.total) ||
        students.length;

    const submitted =
        num(participation.submitted) ||
        num(participation.submittedCurrent) ||
        students.filter(
            student =>
                String(student.status || "")
                    .toLowerCase() ===
                "submitted"
        ).length;

    const pending =
        num(participation.pending) ||
        num(participation.pendingCurrent) ||
        Math.max(
            0,
            total - submitted
        );

    const rate =
        total > 0
            ? Math.round(
                (submitted / total) * 100
            )
            : 0;

    if (!total && !submitted) {
        container.innerHTML = `
            <div class="loading-card">
                No student participation
                data is available yet.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div>
            <strong>
                ${submitted} / ${total} students
            </strong>
        </div>

        <div class="muted">
            Submitted: ${submitted}
            &nbsp; • &nbsp;
            Pending: ${pending}
        </div>

        <div class="progress">
            <div
                class="fill"
                style="width:${Math.min(100, rate)}%">
            </div>
        </div>

        <div class="muted">
            ${rate}% participation
        </div>
    `;
}

/* =========================================================
   SUBMISSION CHECKLIST
========================================================= */

function initChecklist() {
    const button =
        $("view-submission-checklist-btn");

    if (!button) return;

    button.addEventListener(
        "click",
        openChecklist
    );
}

function openChecklist() {
    closeChecklist();

    const participation =
        data?.participation || {};

    const students =
        Array.isArray(participation.students)
            ? participation.students
            : [];

    const total =
        num(participation.eligible) ||
        num(participation.totalStudents) ||
        students.length;

    const submitted =
        num(participation.submitted) ||
        num(participation.submittedCurrent) ||
        students.filter(
            student =>
                String(student.status || "")
                    .toLowerCase() ===
                "submitted"
        ).length;

    const pending =
        Math.max(
            0,
            total - submitted
        );

    const cycle =
        activeCycle();

    const modal =
        document.createElement("div");

    modal.id =
        "submission-checklist-modal";

    modal.innerHTML = `
        <div
            class="submission-checklist-overlay"
            id="submission-checklist-overlay">

            <div class="submission-checklist-modal">

                <div class="submission-checklist-header">

                    <div>
                        <h2>
                            ✅ Submission Checklist
                        </h2>

                        <p>
                            ${escapeHtml(
                                getCycleName(cycle)
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        id="close-submission-checklist"
                        class="submission-checklist-close">
                        ×
                    </button>

                </div>

                <div class="submission-checklist-summary">

                    <div class="checklist-stat">
                        <strong>${total}</strong>
                        <span>Total Students</span>
                    </div>

                    <div class="checklist-stat">
                        <strong>${submitted}</strong>
                        <span>Submitted</span>
                    </div>

                    <div class="checklist-stat">
                        <strong>${pending}</strong>
                        <span>Pending</span>
                    </div>

                </div>

                <div class="submission-checklist-list">

                    ${
                        students.length
                            ? students.map(
                                (student, index) => {
                                    const submitted =
                                        String(
                                            student.status || ""
                                        ).toLowerCase() ===
                                        "submitted";

                                    return `
                                        <div
                                            class="checklist-student">

                                            <div
                                                class="checklist-student-number">
                                                ${index + 1}
                                            </div>

                                            <div
                                                class="checklist-student-name">
                                                ${escapeHtml(
                                                    student.name ||
                                                    "Student"
                                                )}
                                            </div>

                                            <div
                                                class="
                                                    checklist-student-status
                                                    ${submitted
                                                        ? "submitted"
                                                        : "pending"}
                                                ">

                                                ${
                                                    submitted
                                                        ? "✓ Submitted"
                                                        : "○ Pending"
                                                }

                                            </div>

                                        </div>
                                    `;
                                }
                            ).join("")
                            : `
                                <div class="checklist-empty">
                                    Student checklist data
                                    is not available.
                                </div>
                            `
                    }

                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    $("close-submission-checklist")
        ?.addEventListener(
            "click",
            closeChecklist
        );

    $("submission-checklist-overlay")
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target.id ===
                    "submission-checklist-overlay"
                ) {
                    closeChecklist();
                }
            }
        );

    document.addEventListener(
        "keydown",
        checklistEscape
    );
}

function closeChecklist() {
    $("submission-checklist-modal")?.remove();

    document.removeEventListener(
        "keydown",
        checklistEscape
    );
}

function checklistEscape(event) {
    if (event.key === "Escape") {
        closeChecklist();
    }
}

/* =========================================================
   INSIGHTS
========================================================= */

function renderInsights(ratings, cycle) {
    const container =
        $("insights");

    if (!container) return;

    if (!cycle) {
        container.innerHTML = `
            <div class="loading-card">
                No active feedback cycle.
            </div>
        `;
        return;
    }

    const areas =
        PARAMETERS
            .map(([key, label]) => ({
                label,
                value: num(ratings[key])
            }))
            .filter(
                item => item.value > 0
            );

    if (!areas.length) {
        container.innerHTML = `
            <div class="loading-card">
                Not enough feedback data
                for insights yet.
            </div>
        `;
        return;
    }

    const highest =
        [...areas].sort(
            (a, b) => b.value - a.value
        )[0];

    const lowest =
        [...areas].sort(
            (a, b) => a.value - b.value
        )[0];

    const overall =
        average(
            areas.map(item => item.value)
        );

    const message =
        overall >= 4.5
            ? "Student feedback is very positive."
            : overall >= 4
                ? "Overall student feedback is positive."
                : overall >= 3
                    ? "Some areas can be improved."
                    : "Several areas may need attention.";

    container.innerHTML = `
        <div class="insight-card">
            <strong>⭐ Highest Rated</strong>

            <div>
                ${escapeHtml(highest.label)}
                —
                ${rating(highest.value)}/5
            </div>
        </div>

        <div class="insight-card">
            <strong>📌 Needs Attention</strong>

            <div>
                ${escapeHtml(lowest.label)}
                —
                ${rating(lowest.value)}/5
            </div>
        </div>

        <div class="insight-card">
            <strong>💡 Overall Observation</strong>

            <div>
                ${message}
            </div>
        </div>
    `;
}

/* =========================================================
   COMMENTS
========================================================= */

function renderComments(list) {
    const container =
        $("feedback-list");

    if (!container) return;

    if (!Array.isArray(list)) {
        list = [];
    }

    const comments = list
        .map(item => {
            let responses =
                item?.responses;

            if (typeof responses === "string") {
                try {
                    responses =
                        JSON.parse(responses);
                } catch {
                    responses = {};
                }
            }

            return (
                item?.comments ||
                item?.comment ||
                responses?.comments ||
                ""
            );
        })
        .map(comment =>
            String(comment).trim()
        )
        .filter(Boolean);

    if (!comments.length) {
        container.innerHTML = `
            <div class="loading-card">
                No anonymous comments have
                been submitted yet.
            </div>
        `;
        return;
    }

    container.innerHTML = comments
        .slice(0, 8)
        .map(comment => `
            <div class="comment">
                ${escapeHtml(
                    truncate(comment)
                )}
            </div>
        `)
        .join("");
}

/* =========================================================
   NO DATA / ERROR
========================================================= */

function showNoFeedback() {
    setText("overall-rating", "0.0");
    setText("total-feedback", "0");
    setText("cycle-responses", "0");

    setText(
        "cycle-label",
        "No Active Cycle"
    );

    setText(
        "cycle-label-small",
        "No Active Cycle"
    );

    renderRatings({});
    renderHistory([]);
    renderParticipation({});
    renderInsights({}, null);
    renderComments([]);
}

function showFeedbackError() {
    const sections = [
        [
            "monthly-table",
            "Unable to load feedback history."
        ],
        [
            "rating-breakdown",
            "Unable to load rating data."
        ],
        [
            "participation",
            "Unable to load participation data."
        ],
        [
            "insights",
            "Unable to generate insights."
        ],
        [
            "feedback-list",
            "Unable to load anonymous feedback."
        ]
    ];

    sections.forEach(
        ([id, message]) => {
            const element = $(id);

            if (!element) return;

            element.innerHTML = `
                <div class="loading-card">
                    ${message}
                    Please refresh the page.
                </div>
            `;
        }
    );
}

/* =========================================================
   AUTO REFRESH
========================================================= */

async function refreshDashboard() {
    if (
        refreshing ||
        document.hidden
    ) {
        return;
    }

    refreshing = true;

    try {
        await loadFeedback();
    } catch (error) {
        console.error(
            "Dashboard refresh failed:",
            error
        );
    } finally {
        refreshing = false;
    }
}

function startRefresh() {
    stopRefresh();

    refreshTimer =
        setInterval(
            refreshDashboard,
            REFRESH_MS
        );

    console.log(
        "✅ Faculty dashboard auto-refresh: 10 seconds"
    );
}

function stopRefresh() {
    if (!refreshTimer) return;

    clearInterval(refreshTimer);
    refreshTimer = null;
}

document.addEventListener(
    "visibilitychange",
    () => {
        if (document.hidden) {
            stopRefresh();
        } else {
            refreshDashboard();
            startRefresh();
        }
    }
);

window.addEventListener(
    "beforeunload",
    () => {
        stopRefresh();

        if (chart) {
            chart.destroy();
            chart = null;
        }
    }
);

/* =========================================================
   MISC
========================================================= */

function capitalize(value) {
    const text =
        String(value || "");

    return text
        ? text.charAt(0).toUpperCase() +
          text.slice(1)
        : "";
}