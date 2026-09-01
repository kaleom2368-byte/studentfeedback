"use strict";
/* ==========================================================
   GLOBAL VARIABLES
========================================================== */
let performanceChart = null;
let lastFetchedData = null;
let realtimeRefreshTimer = null;
let isRealtimeRefreshing = false;
const REALTIME_REFRESH_INTERVAL = 10000;
/* ==========================================================
   CURRENT FEEDBACK PARAMETERS
========================================================== */
const FEEDBACK_PARAMETERS = [
    {
        key: "course_satisfaction",
        label: "Course Satisfaction"
    },
    {
        key: "syllabus_pace",
        label: "Syllabus Pace"
    },
    {
        key: "concept_clarity",
        label: "Concept Clarity"
    },
    {
        key: "practical_work",
        label: "Practical Work"
    },
    {
        key: "study_material",
        label: "Study Material"
    },
    {
        key: "exam_difficulty",
        label: "Exam Difficulty"
    },
    {
        key: "faculty_support",
        label: "Faculty Support"
    },
    {
        key: "improvement",
        label: "Improvement"
    }
];
/* ==========================================================
   PAGE INITIALIZATION
========================================================== */
document.addEventListener("DOMContentLoaded", () => {

    initializeTheme();

    initializeFilters();

    initializeSubmissionChecklist();

    loadFaculty();

    loadFeedback();

    startRealtimeRefresh();

});
/* ==========================================================
   SAFE DOM HELPERS
========================================================== */
function getElement(id) {
    return document.getElementById(id);
}
function setText(id, value) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
        value === undefined ||
        value === ""
            ? "—"
            : String(value);
}
/* ==========================================================
   THEME
========================================================== */
function initializeTheme() {

    const button = getElement("dark-mode-btn");

    if (!button) {
        return;
    }
    const isAlreadyLight =
        document.body.classList.contains("light-mode") ||
        document.documentElement.dataset.theme === "light" ||
        document.documentElement.classList.contains("light");
    applyTheme(
        isAlreadyLight
            ? "light"
            : "dark"
    );
    button.addEventListener("click", () => {
        const isLight =
            document.body.classList.contains("light-mode") ||
            document.documentElement.dataset.theme === "light" ||
            document.documentElement.classList.contains("light");
        applyTheme(
            isLight
                ? "dark"
                : "light"
        );
    });
}
function applyTheme(theme) {
    const body = document.body;
    const html = document.documentElement;
    const button = getElement("dark-mode-btn");
    if (theme === "light") {
        body.classList.add("light-mode");
        body.classList.remove("dark-mode");
        body.classList.remove("dark");
        html.dataset.theme = "light";
        html.classList.add("light");
        html.classList.remove("dark");
        if (button) {
            button.textContent = "🌙";
            button.setAttribute(
                "aria-label",
                "Switch to dark mode"
            );
            button.setAttribute(
                "title",
                "Switch to dark mode"
            );
        }
    } else {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
        body.classList.remove("dark");
        html.dataset.theme = "dark";
        html.classList.add("dark");
        html.classList.remove("light");
        if (button) {
            button.textContent = "☀️";
            button.setAttribute(
                "aria-label",
                "Switch to light mode"
            );
            button.setAttribute(
                "title",
                "Switch to light mode"
            );
        }
    }
    updatePerformanceChartTheme();
}
/* ==========================================================
   API HELPER
========================================================== */
async function apiGet(path) {
    const response = await fetch(path, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            "Accept": "application/json"
        }
    });
    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status} ${response.statusText}`
        );
    }
    return await response.json();
}
/* ==========================================================
   FACULTY INFORMATION
========================================================== */
async function loadFaculty() {
    try {
        const data =
            await apiGet("/faculty/info");
        console.log(
            "Faculty information:",
            data
        );
        if (!data || data.success === false) {
            console.warn(
                "Faculty information unavailable."
            );
            return;
        }
        const faculty =
            data.faculty ||
            data.user ||
            data.data ||
            data;
        const facultyId =
            faculty.faculty_id ||
            faculty.facultyId ||
            faculty.id ||
            "—";
        const facultyName =
            faculty.name ||
            faculty.faculty_name ||
            faculty.facultyName ||
            "Faculty";
        const department =
            faculty.department ||
            faculty.dept ||
            faculty.department_name ||
            "—";
        const email =
            faculty.email ||
            faculty.faculty_email ||
            "—";
        let subject = "—";
        if (Array.isArray(faculty.subjects)) {
            subject =
                faculty.subjects.join(", ");
        } else {
            subject =
                faculty.subject ||
                faculty.subject_name ||
                faculty.subjects ||
                "—";
        }
        setText(
            "faculty-id",
            facultyId
        );
        setText(
            "faculty-name",
            facultyName
        );
        setText(
            "faculty-department",
            department
        );
        setText(
            "faculty-email",
            email
        );
        setText(
            "faculty-subject",
            subject
        );
        setText(
            "faculty-name-header",
            facultyName
        );
        setText(
            "faculty-department-header",
            department
        );
        setText(
            "welcome-heading",
            `Welcome back, ${facultyName} 👋`
        );
        setText(
            "welcome-sub",
            `${subject} • ${department}`
        );
    } catch (error) {
        console.error(
            "Failed to load faculty information:",
            error
        );
    }
}
/* ==========================================================
   FEEDBACK DATA
========================================================== */
async function loadFeedback() {
    try {
        const data =
            await apiGet("/faculty/feedback");
        console.log(
            "Faculty feedback:",
            data
        );
        if (!data || data.success === false) {
            console.warn(
                "Faculty feedback data unavailable."
            );
            showNoFeedbackState();
            return;
        }
        lastFetchedData = data;
        /* --------------------------------------------------
           TOTAL FEEDBACK
        -------------------------------------------------- */
        const totalFeedback =
            getNumberFromObjects(
                [
                    data,
                    data.statistics,
                    data.stats,
                    data.summary,
                    data.overview
                ],
                [
                    "totalFeedback",
                    "total",
                    "count",
                    "feedbackCount"
                ]
            );
        /* --------------------------------------------------
           RATINGS
        -------------------------------------------------- */
        const ratings =
            extractRatings(data);
        const overall =
            getNumberFromObjects(
                [
                    data,
                    data.statistics,
                    data.stats,
                    data.summary,
                    data.averages
                ],
                [
                    "overall",
                    "overallRating",
                    "overallAverage",
                    "averageRating"
                ]
            ) ||
            calculateAverage(
                Object.values(ratings)
            );
        setText(
            "overall-rating",
            formatRating(overall)
        );
        setText(
            "total-feedback",
            totalFeedback
        );
        /* --------------------------------------------------
           ACTIVE / CURRENT CYCLE
        -------------------------------------------------- */
        const cycles =
            getCycles(data);
        const currentCycle =
            getActiveCycle(data, cycles);
        const cycleLabel =
            getCycleLabel(
                data,
                currentCycle
            );
        setText(
            "cycle-label",
            cycleLabel
        );
        setText(
            "cycle-label-small",
            cycleLabel
        );
        /* --------------------------------------------------
           CURRENT RESPONSES
        -------------------------------------------------- */
        const cycleResponses =
            getCurrentCycleResponses(
                data,
                currentCycle
            );
        setText(
            "cycle-responses",
            cycleResponses
        );
        /* --------------------------------------------------
           RATING BREAKDOWN
        -------------------------------------------------- */
        renderRatingBreakdown(
            ratings
        );
        /* --------------------------------------------------
           PERFORMANCE CHART
        -------------------------------------------------- */
        renderPerformanceChart(
            cycles
        );
        /* --------------------------------------------------
           FEEDBACK HISTORY
        -------------------------------------------------- */
        populateFeedbackHistory(
            cycles
        );
        /* --------------------------------------------------
           PARTICIPATION
        -------------------------------------------------- */
        renderParticipation(
            data,
            currentCycle
        );
        /* --------------------------------------------------
           INSIGHTS
        -------------------------------------------------- */
        renderInsights(
            data,
            ratings,
            currentCycle
        );
        /* --------------------------------------------------
           COMMENTS
        -------------------------------------------------- */
        renderComments(
            data.feedback ||
            data.comments ||
            data.recentFeedback ||
            []
        );
    } catch (error) {
        console.error(
            "Failed to load faculty feedback:",
            error
        );
        showFeedbackError();
    }
}
/* ==========================================================
   GET ACTIVE CYCLE
========================================================== */
function getActiveCycle(data, cycles) {
    /*
       Preferred source:

       data.activeCycle

       This allows the backend to explicitly tell the
       dashboard which cycle is active.

       Example:

       {
           activeCycle: {
               id: 2,
               name: "August 2026",
               status: "active"
           }
       }
    */
    const backendActiveCycle =
        data?.activeCycle ||
        data?.currentCycle ||
        data?.active_cycle ||
        null;
    if (
        backendActiveCycle &&
        typeof backendActiveCycle === "object"
    ) {
        return backendActiveCycle;
    }
    /*
       If the backend returns cycles containing status,
       search specifically for status = active.

       We DO NOT assume cycles[0] is active.
    */
    if (Array.isArray(cycles)) {

        const activeCycle =
            cycles.find(
                cycle =>
                    String(
                        cycle?.status || ""
                    ).toLowerCase() === "active"
            );

        if (activeCycle) {
            return activeCycle;
        }
    }


    /*
       No active cycle.

       This is intentional.

       The dashboard should not silently treat an old
       cycle as the current cycle.
    */

    return null;
}


/* ==========================================================
   CYCLE LABEL
========================================================== */

function getCycleLabel(
    data,
    currentCycle
) {

    if (!currentCycle) {

        return "No Active Cycle";
    }

    return (
        currentCycle.label ||
        currentCycle.name ||
        currentCycle.key ||
        currentCycle.cycle_name ||
        "Active Cycle"
    );
}


/* ==========================================================
   EXTRACT ALL 8 RATINGS
========================================================== */

function extractRatings(data) {

    const sourceObjects = [

        data?.ratings,
        data?.averages,
        data?.statistics,
        data?.stats,
        data?.summary,
        data

    ].filter(Boolean);


    const ratings = {};


    FEEDBACK_PARAMETERS.forEach(
        parameter => {

            ratings[parameter.key] =
                getNumberFromObjects(
                    sourceObjects,
                    getParameterAliases(
                        parameter.key
                    )
                );

        }
    );


    return ratings;
}


/* ==========================================================
   PARAMETER ALIASES
========================================================== */

function getParameterAliases(key) {

    const aliases = {

        course_satisfaction: [
            "course_satisfaction",
            "courseSatisfaction",
            "course_satisfaction_avg",
            "courseSatisfactionAvg",
            "course_satisfaction_average",
            "courseSatisfactionAverage",
            "course"
        ],

        syllabus_pace: [
            "syllabus_pace",
            "syllabusPace",
            "syllabus_pace_avg",
            "syllabusPaceAvg",
            "syllabus_pace_average",
            "syllabusPaceAverage",
            "pace"
        ],

        concept_clarity: [
            "concept_clarity",
            "conceptClarity",
            "concept_clarity_avg",
            "conceptClarityAvg",
            "concept_clarity_average",
            "conceptClarityAverage",
            "clarity"
        ],

        practical_work: [
            "practical_work",
            "practicalWork",
            "practical_work_avg",
            "practicalWorkAvg",
            "practical_work_average",
            "practicalWorkAverage",
            "practical"
        ],

        study_material: [
            "study_material",
            "studyMaterial",
            "study_material_avg",
            "studyMaterialAvg",
            "study_material_average",
            "studyMaterialAverage",
            "material"
        ],

        exam_difficulty: [
            "exam_difficulty",
            "examDifficulty",
            "exam_difficulty_avg",
            "examDifficultyAvg",
            "exam_difficulty_average",
            "examDifficultyAverage",
            "exam"
        ],

        faculty_support: [
            "faculty_support",
            "facultySupport",
            "faculty_support_avg",
            "facultySupportAvg",
            "faculty_support_average",
            "facultySupportAverage",
            "support"
        ],

        improvement: [
            "improvement",
            "improvement_avg",
            "improvementAvg",
            "improvement_average",
            "improvementAverage"
        ]
    };


    return aliases[key] || [key];
}


/* ==========================================================
   NUMBER HELPERS
========================================================== */

function getNumber(object, keys) {

    if (!object) {
        return 0;
    }

    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            object[key] !== ""
        ) {

            const value =
                Number(object[key]);

            if (!Number.isNaN(value)) {
                return value;
            }
        }
    }

    return 0;
}


function getNumberFromObjects(
    objects,
    keys
) {

    for (const object of objects) {

        if (!object) {
            continue;
        }

        const value =
            getNumber(
                object,
                keys
            );

        if (value > 0) {
            return value;
        }
    }

    return 0;
}


/* ==========================================================
   AVERAGE
========================================================== */

function calculateAverage(values) {

    const validValues =
        values.filter(
            value =>
                typeof value === "number" &&
                !Number.isNaN(value) &&
                value > 0
        );


    if (validValues.length === 0) {
        return 0;
    }


    return (
        validValues.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        validValues.length
    );
}


/* ==========================================================
   FORMAT RATING
========================================================== */

function formatRating(value) {

    const number =
        Number(value) || 0;

    return number.toFixed(1);
}


/* ==========================================================
   GET CYCLES
========================================================== */

function getCycles(data) {

    const cycles =
        data?.cycles ||
        data?.history ||
        data?.months ||
        data?.monthlyTrend ||
        [];


    if (!Array.isArray(cycles)) {
        return [];
    }


    return cycles;
}


/* ==========================================================
   CURRENT CYCLE RESPONSES
========================================================== */

function getCurrentCycleResponses(
    data,
    currentCycle
) {

    if (!currentCycle) {
        return 0;
    }


    const participation =
        data?.participation ||
        {};


    const possibleValues = [

        participation.submittedCurrent,

        participation.currentResponses,

        currentCycle.count,

        currentCycle.responses,

        currentCycle.feedbackCount,

        currentCycle.totalResponses,

        data.currentCycle?.responses,

        data.currentCycle?.count,

        data.currentCycle?.feedbackCount

    ];


    for (const value of possibleValues) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number =
                Number(value);

            if (!Number.isNaN(number)) {
                return number;
            }
        }
    }


    return 0;
}


/* ==========================================================
   RATING BREAKDOWN
========================================================== */

function renderRatingBreakdown(ratings) {

    const container =
        getElement("rating-breakdown");

    if (!container) {
        return;
    }


    const parameters =
        FEEDBACK_PARAMETERS.map(
            parameter => ({

                label:
                    parameter.label,

                value:
                    Number(
                        ratings[
                            parameter.key
                        ]
                    ) || 0

            })
        );


    const hasData =
        parameters.some(
            item =>
                item.value > 0
        );


    if (!hasData) {

        container.innerHTML = `
            <div class="loading-card">
                No rating data available yet.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    parameters.forEach(
        parameter => {

            const value =
                Math.max(
                    0,
                    Math.min(
                        5,
                        parameter.value
                    )
                );


            const percentage =
                Math.round(
                    (value / 5) * 100
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "breakdown-row";


            row.innerHTML = `

                <div class="breakdown-label">
                    ${escapeHtml(
                        parameter.label
                    )}
                </div>

                <div class="breakdown-bar">

                    <div
                        class="breakdown-fill"
                        style="width: ${percentage}%">
                    </div>

                </div>

                <div class="breakdown-value">
                    ${value.toFixed(1)}
                </div>

            `;


            container.appendChild(row);
        }
    );
}


/* ==========================================================
   CSS VARIABLE
========================================================== */

function getCssVariable(name) {

    return getComputedStyle(
        document.body
    )
        .getPropertyValue(name)
        .trim();
}


/* ==========================================================
   CHART THEME
========================================================== */

function updatePerformanceChartTheme() {

    if (!performanceChart) {
        return;
    }


    const textColor =
        getCssVariable(
            "--text-muted"
        );

    const borderColor =
        getCssVariable(
            "--border"
        );

    const accentColor =
        getCssVariable(
            "--accent"
        );

    const surfaceColor =
        getCssVariable(
            "--surface"
        );

    const textMainColor =
        getCssVariable(
            "--text"
        );

    const textSecondaryColor =
        getCssVariable(
            "--text-secondary"
        );


    if (
        performanceChart.options.scales?.x
    ) {

        performanceChart.options.scales.x
            .ticks.color =
            textColor;
    }


    if (
        performanceChart.options.scales?.y
    ) {

        performanceChart.options.scales.y
            .ticks.color =
            textColor;

        performanceChart.options.scales.y
            .grid.color =
            borderColor;
    }


    if (
        performanceChart.data.datasets[0]
    ) {

        performanceChart.data.datasets[0]
            .borderColor =
            accentColor;

        performanceChart.data.datasets[0]
            .pointBackgroundColor =
            accentColor;

        performanceChart.data.datasets[0]
            .pointBorderColor =
            accentColor;
    }


    if (
        performanceChart.options.plugins?.tooltip
    ) {

        performanceChart.options.plugins.tooltip
            .backgroundColor =
            surfaceColor;

        performanceChart.options.plugins.tooltip
            .titleColor =
            textMainColor;

        performanceChart.options.plugins.tooltip
            .bodyColor =
            textSecondaryColor;

        performanceChart.options.plugins.tooltip
            .borderColor =
            borderColor;
    }


    performanceChart.update(
        "none"
    );
}


/* ==========================================================
   PERFORMANCE TREND CHART
========================================================== */

function renderPerformanceChart(
    cycles
) {

    const canvas =
        getElement(
            "perfTrendChart"
        );

    if (!canvas) {
        return;
    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;
    }


    /*
       Only display actual cycle data.
       No fake/current-cycle data is generated.
    */

    const labels =
        cycles.map(
            cycle =>
                cycle.label ||
                cycle.name ||
                cycle.key ||
                cycle.cycle_name ||
                "Cycle"
        );


    const values =
        cycles.map(
            cycle => {

                const direct =
                    getNumber(
                        cycle,
                        [
                            "overall",
                            "overallRating",
                            "overallAverage",
                            "average"
                        ]
                    );


                if (direct > 0) {
                    return direct;
                }


                const cycleRatings =
                    extractRatings(
                        cycle
                    );


                return calculateAverage(
                    Object.values(
                        cycleRatings
                    )
                );
            }
        );


    if (performanceChart) {

        performanceChart.destroy();

        performanceChart = null;
    }


    const textColor =
        getCssVariable(
            "--text-muted"
        );

    const borderColor =
        getCssVariable(
            "--border"
        );

    const accentColor =
        getCssVariable(
            "--accent"
        );


    performanceChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Overall Rating",

                            data:
                                values,

                            borderColor:
                                accentColor,

                            backgroundColor:
                                "rgba(79, 141, 247, 0.08)",

                            borderWidth:
                                2,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6,

                            pointBackgroundColor:
                                accentColor,

                            pointBorderColor:
                                accentColor,

                            tension:
                                0.25,

                            fill:
                                true

                        }

                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"
                    },

                    plugins: {

                        legend: {

                            display:
                                false
                        },

                        tooltip: {

                            backgroundColor:
                                getCssVariable(
                                    "--surface"
                                ),

                            titleColor:
                                getCssVariable(
                                    "--text"
                                ),

                            bodyColor:
                                getCssVariable(
                                    "--text-secondary"
                                ),

                            borderColor:
                                borderColor,

                            borderWidth:
                                1,

                            padding:
                                10
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            min:
                                0,

                            max:
                                5,

                            ticks: {

                                stepSize:
                                    1,

                                color:
                                    textColor
                            },

                            grid: {

                                color:
                                    borderColor
                            }
                        },

                        x: {

                            ticks: {

                                color:
                                    textColor
                            },

                            grid: {

                                display:
                                    false
                            }
                        }
                    }
                }
            }
        );
}


/* ==========================================================
   FEEDBACK HISTORY
========================================================== */

function populateFeedbackHistory(
    cycles
) {

    const container =
        getElement(
            "monthly-table"
        );

    if (!container) {
        return;
    }


    if (
        !Array.isArray(cycles) ||
        cycles.length === 0
    ) {

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

                    ${FEEDBACK_PARAMETERS.map(
                        parameter =>
                            `<th>
                                ${escapeHtml(
                                    parameter.label
                                )}
                            </th>`
                    ).join("")}

                    <th>Trend</th>

                </tr>

            </thead>

            <tbody>

    `;


    cycles.forEach(
        (cycle, index) => {

            const label =
                cycle.label ||
                cycle.name ||
                cycle.key ||
                cycle.cycle_name ||
                "—";


            const status =
                String(
                    cycle.status ||
                    ""
                ).toLowerCase();


            const statusLabel =
                status === "active"
                    ? "Active"
                    : status
                        ? capitalize(status)
                        : "—";


            const responses =
                getNumber(
                    cycle,
                    [
                        "count",
                        "responses",
                        "feedbackCount",
                        "total",
                        "totalResponses"
                    ]
                );


            const cycleRatings =
                extractRatings(
                    cycle
                );


            const overall =
                getNumber(
                    cycle,
                    [
                        "overall",
                        "overallRating",
                        "overallAverage",
                        "average"
                    ]
                ) ||
                calculateAverage(
                    Object.values(
                        cycleRatings
                    )
                );


            const trend =
                calculateTrend(
                    cycles,
                    index
                );


            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            label
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            statusLabel
                        )}
                    </td>

                    <td>
                        ${responses}
                    </td>

                    <td>
                        ${formatRating(
                            overall
                        )}
                    </td>

                    ${FEEDBACK_PARAMETERS.map(
                        parameter => `

                            <td>
                                ${formatRating(
                                    cycleRatings[
                                        parameter.key
                                    ]
                                )}
                            </td>

                        `
                    ).join("")}

                    <td>
                        ${escapeHtml(
                            trend
                        )}
                    </td>

                </tr>

            `;
        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;
}


/* ==========================================================
   TREND
========================================================== */

function calculateTrend(
    cycles,
    index
) {

    if (
        !Array.isArray(cycles) ||
        index >= cycles.length - 1
    ) {

        return "—";
    }


    const current =
        getCycleOverall(
            cycles[index]
        );


    const previous =
        getCycleOverall(
            cycles[index + 1]
        );


    if (
        current === 0 ||
        previous === 0
    ) {

        return "—";
    }


    const difference =
        current - previous;


    if (
        Math.abs(
            difference
        ) < 0.05
    ) {

        return "—";
    }


    if (
        difference > 0
    ) {

        return `▲ ${difference.toFixed(1)}`;
    }


    return `▼ ${Math.abs(
        difference
    ).toFixed(1)}`;
}


function getCycleOverall(cycle) {

    const direct =
        getNumber(
            cycle,
            [
                "overall",
                "overallRating",
                "overallAverage",
                "average"
            ]
        );


    if (direct > 0) {
        return direct;
    }


    const ratings =
        extractRatings(
            cycle
        );


    return calculateAverage(
        Object.values(
            ratings
        )
    );
}


/* ==========================================================
   FEEDBACK FILTERS
========================================================== */

function initializeFilters() {

    const buttons =
        document.querySelectorAll(
            ".filter"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    const period =
                        button.dataset.period;


                    const cycles =
                        getCycles(
                            lastFetchedData ||
                            {}
                        );


                    if (
                        period === "current"
                    ) {

                        const activeCycle =
                            getActiveCycle(
                                lastFetchedData || {},
                                cycles
                            );


                        if (activeCycle) {

                            populateFeedbackHistory(
                                [activeCycle]
                            );

                        } else {

                            populateFeedbackHistory(
                                []
                            );
                        }


                    } else if (
                        period === "previous"
                    ) {

                        const activeCycle =
                            getActiveCycle(
                                lastFetchedData || {},
                                cycles
                            );


                        const activeId =
                            getCycleId(
                                activeCycle
                            );


                        const previousCycles =
                            cycles.filter(
                                cycle =>
                                    getCycleId(
                                        cycle
                                    ) !== activeId
                            );


                        populateFeedbackHistory(
                            previousCycles.slice(
                                0,
                                1
                            )
                        );


                    } else {

                        populateFeedbackHistory(
                            cycles
                        );
                    }

                }
            );
        }
    );
}


/* ==========================================================
   CYCLE ID HELPER
========================================================== */

function getCycleId(cycle) {

    if (!cycle) {
        return null;
    }


    return (
        cycle.id ??
        cycle.cycle_id ??
        cycle.cycleId ??
        null
    );
}


/* ==========================================================
   PARTICIPATION
========================================================== */

function renderParticipation(
    data,
    currentCycle
) {

    const container =
        getElement(
            "participation"
        );

    if (!container) {
        return;
    }


    /*
       If there is no active cycle, participation must not
       display old-cycle numbers as if they were current.
    */

    if (!currentCycle) {

        container.innerHTML = `
            <div class="loading-card">
                No active feedback cycle.
            </div>
        `;

        return;
    }


    const participation =
        data.participation ||
        {};


    const totalStudents =
        getNumber(
            participation,
            [
                "totalStudents",
                "total",
                "studentCount"
            ]
        );


    const submitted =
        getNumber(
            participation,
            [
                "submittedCurrent",
                "submitted",
                "currentResponses",
                "responses"
            ]
        );


    const cycleResponses =
        getNumber(
            currentCycle,
            [
                "count",
                "responses",
                "feedbackCount",
                "total",
                "totalResponses"
            ]
        );


    const finalSubmitted =
        submitted ||
        cycleResponses;


    const rate =
        totalStudents > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        finalSubmitted /
                        totalStudents
                    ) * 100
                )
            )
            : 0;


    if (
        totalStudents === 0 &&
        finalSubmitted === 0
    ) {

        container.innerHTML = `
            <div class="loading-card">
                Participation data is not available yet.
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div>

            <strong>
                ${finalSubmitted} /
                ${totalStudents}
                students
            </strong>

        </div>

        <div class="muted">
            Participation Rate
        </div>

        <div class="progress">

            <div
                class="fill"
                style="width: ${rate}%">
            </div>

        </div>

        <div class="muted">
            ${rate}% participation
        </div>

    `;
}
// ===========================================================
// SUBMISSION CHECKLIST
// ===========================================================

function initializeSubmissionChecklist() {
    const button = getElement("view-submission-checklist-btn");

    if (!button) {
        console.warn(
            "Submission Checklist button not found."
        );
        return;
    }

    button.addEventListener("click", () => {
        openSubmissionChecklist();
    });

    console.log(
        "✅ Submission Checklist button initialized."
    );
}


// ===========================================================
// OPEN SUBMISSION CHECKLIST
// ===========================================================

function openSubmissionChecklist() {

    // Remove an existing checklist if already open
    const existingModal =
        getElement("submission-checklist-modal");

    if (existingModal) {
        existingModal.remove();
    }

    // -------------------------------------------------------
    // Get participation data from the latest API response
    // -------------------------------------------------------

    const participation =
        lastFetchedData?.participation || {};

    const students =
        Array.isArray(participation.students)
            ? participation.students
            : [];

    const totalStudents =
        Number(participation.totalStudents) || students.length;

    const submittedCount =
        Number(participation.submittedCurrent) ||
        students.filter(
            student => student.status === "Submitted"
        ).length;

    const pendingCount =
        Number(participation.pendingCurrent) ||
        students.filter(
            student => student.status === "Pending"
        ).length;

    const activeCycle =
        lastFetchedData?.activeCycle || null;

    // -------------------------------------------------------
    // Create modal
    // -------------------------------------------------------

    const modal =
        document.createElement("div");

    modal.id =
        "submission-checklist-modal";

    modal.innerHTML = `
        <div
            class="submission-checklist-overlay"
            id="submission-checklist-overlay"
        >

            <div class="submission-checklist-modal">

                <div class="submission-checklist-header">

                    <div>
                        <h2>
                            ✅ Submission Checklist
                        </h2>

                        <p>
                            ${
                                escapeHtml(
                                    activeCycle?.name ||
                                    "Current Feedback Cycle"
                                )
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        id="close-submission-checklist"
                        class="submission-checklist-close"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>

                <div class="submission-checklist-summary">

                    <div class="checklist-stat">
                        <strong>
                            ${totalStudents}
                        </strong>
                        <span>
                            Total Students
                        </span>
                    </div>

                    <div class="checklist-stat">
                        <strong>
                            ${submittedCount}
                        </strong>
                        <span>
                            Submitted
                        </span>
                    </div>

                    <div class="checklist-stat">
                        <strong>
                            ${pendingCount}
                        </strong>
                        <span>
                            Pending
                        </span>
                    </div>

                </div>

                <div class="submission-checklist-list">

                    ${
                        students.length === 0
                            ? `
                                <div class="checklist-empty">
                                    No student participation
                                    data is available.
                                </div>
                              `
                            : students.map(
                                (student, index) => {

                                    const name =
                                        student?.name ||
                                        "Unnamed Student";

                                    const status =
                                        student?.status ===
                                        "Submitted"
                                            ? "Submitted"
                                            : "Pending";

                                    const statusClass =
                                        status === "Submitted"
                                            ? "submitted"
                                            : "pending";

                                    return `
                                        <div
                                            class="checklist-student"
                                        >

                                            <div
                                                class="checklist-student-number"
                                            >
                                                ${index + 1}
                                            </div>

                                            <div
                                                class="checklist-student-name"
                                            >
                                                ${escapeHtml(name)}
                                            </div>

                                            <div
                                                class="
                                                    checklist-student-status
                                                    ${statusClass}
                                                "
                                            >
                                                ${
                                                    status ===
                                                    "Submitted"
                                                        ? "✓ Submitted"
                                                        : "○ Pending"
                                                }
                                            </div>

                                        </div>
                                    `;
                                }
                            ).join("")
                    }

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    // -------------------------------------------------------
    // Close button
    // -------------------------------------------------------

    const closeButton =
        getElement("close-submission-checklist");

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeSubmissionChecklist
        );
    }

    // -------------------------------------------------------
    // Close when clicking outside modal
    // -------------------------------------------------------

    const overlay =
        getElement("submission-checklist-overlay");

    if (overlay) {
        overlay.addEventListener("click", event => {

            if (
                event.target === overlay
            ) {
                closeSubmissionChecklist();
            }

        });
    }

    // -------------------------------------------------------
    // Close with Escape
    // -------------------------------------------------------

    document.addEventListener(
        "keydown",
        handleChecklistEscape
    );

    console.log(
        "✅ Submission Checklist opened:",
        students.length,
        "students"
    );
}


// ===========================================================
// CLOSE SUBMISSION CHECKLIST
// ===========================================================

function closeSubmissionChecklist() {

    const modal =
        getElement("submission-checklist-modal");

    if (modal) {
        modal.remove();
    }

    document.removeEventListener(
        "keydown",
        handleChecklistEscape
    );
}


// ===========================================================
// ESCAPE KEY
// ===========================================================

function handleChecklistEscape(event) {

    if (event.key === "Escape") {
        closeSubmissionChecklist();
    }
}

/* ==========================================================
   INSIGHTS
========================================================== */

function renderInsights(
    data,
    ratings,
    currentCycle
) {

    const container =
        getElement(
            "insights"
        );

    if (!container) {
        return;
    }


    if (!currentCycle) {

        container.innerHTML = `
            <div class="loading-card">
                Insights will appear when an active feedback cycle is available.
            </div>
        `;

        return;
    }


    const areas =
        FEEDBACK_PARAMETERS
            .map(
                parameter => ({

                    label:
                        parameter.label,

                    value:
                        Number(
                            ratings[
                                parameter.key
                            ]
                        ) || 0

                })
            )
            .filter(
                area =>
                    area.value > 0
            );


    if (
        areas.length === 0
    ) {

        container.innerHTML = `
            <div class="loading-card">
                Not enough feedback data for insights yet.
            </div>
        `;

        return;
    }


    const sorted =
        [...areas].sort(
            (a, b) =>
                b.value - a.value
        );


    const strongest =
        sorted[0];


    const weakest =
        sorted[
            sorted.length - 1
        ];


    const overall =
        calculateAverage(
            areas.map(
                area =>
                    area.value
            )
        );


    let overallMessage =
        "Feedback data is still developing.";


    if (overall >= 4.5) {

        overallMessage =
            "Student feedback is very positive.";

    } else if (
        overall >= 4
    ) {

        overallMessage =
            "Overall student feedback is positive.";

    } else if (
        overall >= 3
    ) {

        overallMessage =
            "Feedback indicates some areas can be improved.";

    } else {

        overallMessage =
            "Several areas may need attention.";
    }


    container.innerHTML = `

        <div class="insight-card">

            <strong>
                ⭐ Strongest Area
            </strong>

            <div>
                ${escapeHtml(
                    strongest.label
                )}

                •

                ${formatRating(
                    strongest.value
                )} / 5
            </div>

        </div>


        <div class="insight-card">

            <strong>
                📈 Area for Attention
            </strong>

            <div>
                ${escapeHtml(
                    weakest.label
                )}

                •

                ${formatRating(
                    weakest.value
                )} / 5
            </div>

        </div>


        <div class="insight-card">

            <strong>
                💡 Overall Observation
            </strong>

            <div>
                ${escapeHtml(
                    overallMessage
                )}
            </div>

        </div>

    `;
}


/* ==========================================================
   ANONYMOUS COMMENTS
========================================================== */

function renderComments(list) {

    const container =
        getElement(
            "feedback-list"
        );

    if (!container) {
        return;
    }


    if (
        !Array.isArray(list)
    ) {

        list = [];
    }


    const comments =
        list.filter(
            item => {

                if (!item) {
                    return false;
                }


                const comment =
                    item.comments ||
                    item.comment ||
                    item.feedback ||
                    "";


                return String(
                    comment
                )
                    .trim()
                    .length > 0;
            }
        );


    if (
        comments.length === 0
    ) {

        container.innerHTML = `
            <div class="loading-card">
                No anonymous comments have been submitted yet.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    comments
        .slice(
            0,
            8
        )
        .forEach(
            item => {

                const comment =
                    item.comments ||
                    item.comment ||
                    item.feedback ||
                    "";


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "comment";


                card.textContent =
                    truncate(
                        comment,
                        400
                    );


                container.appendChild(
                    card
                );
            }
        );
}


/* ==========================================================
   NO FEEDBACK STATE
========================================================== */

function showNoFeedbackState() {

    setText(
        "overall-rating",
        "0.0"
    );

    setText(
        "total-feedback",
        "0"
    );

    setText(
        "cycle-responses",
        "0"
    );

    setText(
        "cycle-label",
        "No Active Cycle"
    );

    setText(
        "cycle-label-small",
        "No Active Cycle"
    );


    renderRatingBreakdown(
        createEmptyRatings()
    );


    populateFeedbackHistory(
        []
    );


    renderParticipation(
        {},
        null
    );


    renderInsights(
        {},
        createEmptyRatings(),
        null
    );


    renderComments(
        []
    );
}


/* ==========================================================
   EMPTY RATINGS
========================================================== */

function createEmptyRatings() {

    const ratings = {};


    FEEDBACK_PARAMETERS.forEach(
        parameter => {

            ratings[
                parameter.key
            ] = 0;

        }
    );


    return ratings;
}


/* ==========================================================
   FEEDBACK ERROR STATE
========================================================== */

function showFeedbackError() {

    const history =
        getElement(
            "monthly-table"
        );


    if (history) {

        history.innerHTML = `
            <div class="loading-card">
                Unable to load feedback history.
                Please refresh the page.
            </div>
        `;
    }


    const rating =
        getElement(
            "rating-breakdown"
        );


    if (rating) {

        rating.innerHTML = `
            <div class="loading-card">
                Unable to load rating data.
            </div>
        `;
    }


    const participation =
        getElement(
            "participation"
        );


    if (participation) {

        participation.innerHTML = `
            <div class="loading-card">
                Unable to load participation data.
            </div>
        `;
    }


    const insights =
        getElement(
            "insights"
        );


    if (insights) {

        insights.innerHTML = `
            <div class="loading-card">
                Unable to generate insights.
            </div>
        `;
    }
}


/* ==========================================================
   HTML ESCAPE
========================================================== */

function escapeHtml(value) {

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


/* ==========================================================
   TEXT TRUNCATION
========================================================== */

function truncate(
    value,
    maxLength
) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    if (
        text.length <= maxLength
    ) {

        return text;
    }


    return (
        text.substring(
            0,
            maxLength - 1
        ) +
        "…"
    );
}


/* ==========================================================
   CAPITALIZE
========================================================== */

function capitalize(value) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


/* ==========================================================
   REAL-TIME DASHBOARD REFRESH
========================================================== */

async function refreshFacultyDashboard() {

    if (isRealtimeRefreshing) {
        return;
    }


    if (document.hidden) {
        return;
    }


    isRealtimeRefreshing = true;


    try {

        console.log(
            "[REALTIME] Checking for new feedback..."
        );


        await loadFeedback();


        console.log(
            "[REALTIME] Dashboard updated."
        );

    } catch (error) {

        console.error(
            "[REALTIME] Dashboard refresh failed:",
            error
        );

    } finally {

        isRealtimeRefreshing = false;
    }
}


/* ==========================================================
   START REAL-TIME REFRESH
========================================================== */

function startRealtimeRefresh() {

    if (realtimeRefreshTimer) {

        clearInterval(
            realtimeRefreshTimer
        );
    }


    realtimeRefreshTimer =
        setInterval(
            refreshFacultyDashboard,
            REALTIME_REFRESH_INTERVAL
        );


    console.log(
        "[REALTIME] Auto-refresh enabled: every 10 seconds"
    );
}


/* ==========================================================
   STOP REAL-TIME REFRESH
========================================================== */

function stopRealtimeRefresh() {

    if (realtimeRefreshTimer) {

        clearInterval(
            realtimeRefreshTimer
        );

        realtimeRefreshTimer = null;


        console.log(
            "[REALTIME] Auto-refresh stopped."
        );
    }
}


/* ==========================================================
   HANDLE TAB VISIBILITY
========================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            stopRealtimeRefresh();

        } else {

            /*
               Immediately fetch the latest dashboard data
               when the user returns to the tab.
            */

            refreshFacultyDashboard();

            startRealtimeRefresh();
        }

    }
);
/* ==========================================================
   CLEANUP
========================================================== */
window.addEventListener(
    "beforeunload",
    () => {

        stopRealtimeRefresh();

        if (performanceChart) {

            performanceChart.destroy();

            performanceChart = null;
        }
    }
);
