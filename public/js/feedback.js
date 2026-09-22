document.addEventListener("DOMContentLoaded", () => {
    // =========================================================
    // CONFIG
    // =========================================================

    const SUBJECTS = {
        BCN: {
            name: "Basic of Computer Networking",
            type: "Theory",
            icon: "🌐"
        },
        DELD: {
            name: "Digital Electronics & Logic Design",
            type: "Theory",
            icon: "💡"
        },
        DSA: {
            name: "Data Structures & Algorithms",
            type: "Theory + Practical",
            icon: "🧠"
        },
        OOP: {
            name: "Object Oriented Programming",
            type: "Theory + Practical",
            icon: "💻"
        }
    };

    const SUBJECT_ORDER = ["BCN", "DELD", "DSA", "OOP"];

    const QUESTIONS = {
        course_satisfaction: {
            text: "How satisfied are you with the overall teaching of this subject?",
            options: [
                "Very Satisfied",
                "Satisfied",
                "Neutral",
                "Dissatisfied"
            ]
        },

        syllabus_pace: {
            text: "How appropriate was the pace of syllabus completion?",
            options: [
                "Very Appropriate",
                "Appropriate",
                "Neutral",
                "Too Fast",
                "Too Slow"
            ]
        },

        concept_clarity: {
            text: "How clearly were the concepts explained?",
            options: [
                "Very Clear",
                "Clear",
                "Neutral",
                "Not Clear"
            ]
        },

        practical_work: {
            text: "How useful were the practical assignments?",
            options: [
                "Very Helpful",
                "Helpful",
                "Neutral",
                "Not Helpful"
            ]
        },

        study_material: {
            text: "How useful were the study materials provided?",
            options: [
                "Very Helpful",
                "Helpful",
                "Neutral",
                "Not Helpful"
            ]
        },

        exam_difficulty: {
            text: "How appropriate was the difficulty level of examinations?",
            options: [
                "Very Appropriate",
                "Appropriate",
                "Neutral",
                "Difficult",
                "Very Difficult"
            ]
        },

        faculty_support: {
            text: "How effectively did the faculty support your learning?",
            options: [
                "Excellent",
                "Good",
                "Average",
                "Needs Improvement"
            ]
        },

        improvement: {
            text: "How would you rate the overall improvement in your understanding of this subject?",
            options: [
                "Excellent",
                "Good",
                "Average",
                "Needs Improvement"
            ]
        }
    };

    // =========================================================
    // STATE
    // =========================================================

    const selectedSubjects = new Set();
    const completedSubjects = new Set();

    let facultyData = [];
    let submitting = false;

    // =========================================================
    // HELPERS
    // =========================================================

    const $ = (id) => document.getElementById(id);

    const subjectButtons = document.querySelectorAll(".subject-btn");
    const selectedContainer = $("selected-subjects-container");
    const selectedCount = $("selected-subject-count");

    const progressPercent = $("progress-percent");
    const progressFill = $("progress-fill");
    const progressText = $("subject-progress-text");

    const feedbackForm = $("feedback-form");
    const submitButton = $("submit-all-feedback");

    const selectAllButton = $("select-all-subjects");
    const clearAllButton = $("clear-all-subjects");

    const alreadySubmittedMessage = $("already-submitted-message");
    const cycleStatus = $("cycle-status");

    function getSubjectCode(subject) {
        const value = String(subject || "").trim();

        if (!value) return "";

        const match = value.match(/\(([^)]+)\)\s*$/);

        if (match) {
            return match[1].trim().toUpperCase();
        }

        const aliases = {
            "basic of computer networking": "BCN",
            "basics of computer networking": "BCN",
            "digital electronics and logic design": "DELD",
            "data structures and algorithms": "DSA",
            "object-oriented programming": "OOP",
            "object oriented programming": "OOP"
        };

        return (
            aliases[value.toLowerCase().replace(/\s+/g, " ")] ||
            value.toUpperCase()
        );
    }

    function getFacultyForSubject(subjectCode) {
        return facultyData.filter(
            (faculty) =>
                getSubjectCode(faculty.subject) === subjectCode
        );
    }

    // =========================================================
    // FACULTY
    // =========================================================

    async function loadFaculty() {
        try {
            const response = await fetch("/feedback/faculty", {
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to load faculty"
                );
            }

            facultyData = Array.isArray(data.faculty)
                ? data.faculty
                : [];

            console.log("Feedback faculty loaded:", facultyData);

            refreshFacultyDropdowns();
        } catch (error) {
            console.error("Failed to load faculty:", error);

            showMessage(
                "❌ Failed to load faculty information. Please refresh the page.",
                "error"
            );
        }
    }

    function refreshFacultyDropdowns() {
        document.querySelectorAll(".subject-feedback").forEach((section) => {
            const select = section.querySelector(".faculty-select");
            const department = section.querySelector(".department-input");

            if (!select) return;

            const subjectCode = section.dataset.subject;
            const faculty = getFacultyForSubject(subjectCode);

            const previousValue = select.value;

            select.innerHTML = "";

            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select Faculty";
            select.appendChild(defaultOption);

            faculty.forEach((item) => {
                const option = document.createElement("option");

                option.value = item.faculty_id;
                option.textContent = item.name;

                select.appendChild(option);
            });

            // -------------------------------------------------
            // NEW:
            // If only one faculty teaches this subject,
            // automatically select them.
            // -------------------------------------------------

            if (faculty.length === 1) {
                const teacher = faculty[0];

                select.value = teacher.faculty_id;
                select.disabled = true;

                if (department) {
                    department.value = teacher.department || "";
                }

                section.classList.add("faculty-auto-selected");
            } else {
                select.disabled = false;
                section.classList.remove("faculty-auto-selected");

                if (
                    faculty.some(
                        (item) =>
                            String(item.faculty_id) ===
                            String(previousValue)
                    )
                ) {
                    select.value = previousValue;

                    const teacher = faculty.find(
                        (item) =>
                            String(item.faculty_id) ===
                            String(previousValue)
                    );

                    if (department) {
                        department.value =
                            teacher?.department || "";
                    }
                } else {
                    select.value = "";

                    if (department) {
                        department.value = "";
                    }
                }
            }
        });

        updateProgress();
    }

    // =========================================================
    // SUBJECT SELECTION
    // =========================================================

    function toggleSubject(code) {
        if (!SUBJECTS[code]) return;

        if (selectedSubjects.has(code)) {
            selectedSubjects.delete(code);
            completedSubjects.delete(code);
        } else {
            selectedSubjects.add(code);
        }

        updateSubjectButtons();
        renderForms();
        updateProgress();
    }

    function updateSubjectButtons() {
        subjectButtons.forEach((button) => {
            const selected = selectedSubjects.has(
                button.dataset.subject
            );

            button.classList.toggle("selected", selected);

            button.setAttribute(
                "aria-pressed",
                String(selected)
            );
        });

        if (selectedCount) {
            const count = selectedSubjects.size;

            selectedCount.textContent =
                `${count} ${
                    count === 1 ? "subject" : "subjects"
                } selected`;
        }
    }

    // =========================================================
    // FORM CREATION
    // =========================================================

    function renderForms() {
        if (!selectedContainer) return;

        selectedContainer.innerHTML = "";

        SUBJECT_ORDER.forEach((code) => {
            if (selectedSubjects.has(code)) {
                selectedContainer.appendChild(
                    createSubjectSection(code)
                );
            }
        });

        refreshFacultyDropdowns();
    }

    function createSubjectSection(code) {
        const subject = SUBJECTS[code];

        const section = document.createElement("section");

        section.className = "subject-feedback";
        section.dataset.subject = code;

        section.innerHTML = `
            <div class="subject-header">
                <h2>${subject.icon} ${subject.name}</h2>
                <p>${subject.type} feedback</p>
            </div>

            <div class="faculty-card">
                <div class="section-title">
                    <h3>👨‍🏫 Faculty Information</h3>
                    <p>Faculty teaching this subject.</p>
                </div>

                <div class="faculty-grid">

                    <div class="input-group">
                        <label>👨‍🏫 Faculty</label>

                        <select
                            class="faculty-select"
                            data-field="faculty"
                            required
                        >
                            <option value="">Select Faculty</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label>🏫 Department</label>

                        <input
                            class="department-input"
                            data-field="department"
                            type="text"
                            readonly
                            placeholder="Department"
                        >
                    </div>

                    <div class="input-group">
                        <label>📚 Subject</label>

                        <input
                            class="selected-subject-input"
                            data-field="subject"
                            type="text"
                            value="${code}"
                            readonly
                        >
                    </div>

                </div>
            </div>
        `;

        const questions = document.createElement("div");

        questions.className =
            "form-section questions-container";

        addQuestionSection(
            questions,
            "📖 Theory Feedback",
            [
                "course_satisfaction",
                "syllabus_pace",
                "concept_clarity"
            ],
            code
        );

        if (code === "DSA" || code === "OOP") {
            addQuestionSection(
                questions,
                "🧪 Practical / Lab Experience",
                ["practical_work"],
                code
            );
        }

        addQuestionSection(
            questions,
            "📚 Course & Faculty Feedback",
            [
                "study_material",
                "exam_difficulty",
                "faculty_support",
                "improvement"
            ],
            code
        );

        addComments(questions, code);

        section.appendChild(questions);

        const footer = document.createElement("div");

        footer.className = "subject-completion";

        footer.innerHTML = `
            <span class="completion-status">
                ⏳ Complete all required questions
            </span>
        `;

        section.appendChild(footer);

        // Faculty change
        section
            .querySelector(".faculty-select")
            .addEventListener("change", (event) => {
                const faculty = facultyData.find(
                    (item) =>
                        String(item.faculty_id) ===
                        String(event.target.value)
                );

                const department =
                    section.querySelector(".department-input");

                if (department) {
                    department.value =
                        faculty?.department || "";
                }

                updateProgress();
            });

        // Question changes
        section.addEventListener("change", updateProgress);
        section.addEventListener("input", updateProgress);

        return section;
    }

    function addQuestionSection(
        container,
        title,
        keys,
        subjectCode
    ) {
        const wrapper = document.createElement("div");

        wrapper.className = "question-section";

        wrapper.innerHTML = `
            <div class="question-section-heading">
                <h3>${title}</h3>
            </div>
        `;

        keys.forEach((key, index) => {
            const question = QUESTIONS[key];

            if (!question) return;

            const card = document.createElement("div");

            card.className = "question-card";

            card.innerHTML = `
                <div class="question-number">
                    ${index + 1}
                </div>

                <div class="question-content">
                    <h4>${question.text}</h4>

                    <div class="options">
                        ${question.options
                            .map(
                                (option) => `
                                    <label class="option">
                                        <input
                                            type="radio"
                                            name="${subjectCode}_${key}"
                                            value="${option}"
                                            required
                                        >
                                        <span>${option}</span>
                                    </label>
                                `
                            )
                            .join("")}
                    </div>
                </div>
            `;

            wrapper.appendChild(card);
        });

        container.appendChild(wrapper);
    }

    function addComments(container, subjectCode) {
        const wrapper = document.createElement("div");

        wrapper.className = "comments-section";

        wrapper.innerHTML = `
            <div class="question-section-heading">
                <h3>💬 Additional Comments</h3>

                <p>
                    Optional: Share suggestions or feedback
                    that may help improve this subject.
                </p>
            </div>

            <textarea
                class="comments-input"
                data-question="comments"
                name="${subjectCode}_comments"
                rows="5"
                placeholder="Write your suggestions here..."
            ></textarea>
        `;

        container.appendChild(wrapper);
    }

    // =========================================================
    // VALIDATION
    // =========================================================

    function validateSubject(section) {
        const code = section.dataset.subject;

        const faculty =
            section.querySelector(".faculty-select");

        let valid = Boolean(faculty?.value);

        section
            .querySelectorAll("input[required]")
            .forEach((input) => {
                if (
                    input.type !== "radio" &&
                    !input.value
                ) {
                    valid = false;
                }
            });

        const radioGroups = new Set(
            [
                ...section.querySelectorAll(
                    "input[type='radio'][required]"
                )
            ].map((input) => input.name)
        );

        radioGroups.forEach((name) => {
            if (
                !section.querySelector(
                    `input[name="${CSS.escape(name)}"]:checked`
                )
            ) {
                valid = false;
            }
        });

        const status =
            section.querySelector(".completion-status");

        if (valid) {
            if (status) {
                status.textContent =
                    "✅ Subject feedback complete";
            }

            section.classList.add("completed");
            completedSubjects.add(code);
        } else {
            if (status) {
                status.textContent =
                    "⏳ Complete all required questions";
            }

            section.classList.remove("completed");
            completedSubjects.delete(code);
        }

        return valid;
    }

    function validateAllSubjects() {
        if (!selectedSubjects.size) {
            showMessage(
                "⚠️ Please select at least one subject.",
                "error"
            );

            return false;
        }

        let firstInvalid = null;

        document
            .querySelectorAll(".subject-feedback")
            .forEach((section) => {
                if (
                    !validateSubject(section) &&
                    !firstInvalid
                ) {
                    firstInvalid = section;
                }
            });

        updateProgress();

        if (firstInvalid) {
            showMessage(
                "⚠️ Please complete all required questions for every selected subject.",
                "error"
            );

            firstInvalid.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            return false;
        }

        return true;
    }

    // =========================================================
    // COLLECT FEEDBACK
    // =========================================================

    function collectFeedback() {
        const feedback = {};

        document
            .querySelectorAll(".subject-feedback")
            .forEach((section) => {
                const code = section.dataset.subject;

                const answers = {};

                section
                    .querySelectorAll(
                        "input[type='radio']:checked"
                    )
                    .forEach((input) => {
                        answers[
                            input.name.replace(
                                `${code}_`,
                                ""
                            )
                        ] = input.value;
                    });

                const comments =
                    section.querySelector(
                        ".comments-input"
                    );

                if (comments?.value.trim()) {
                    answers.comments =
                        comments.value.trim();
                }

                feedback[code] = {
                    subject: code,

                    faculty_id:
                        section.querySelector(
                            ".faculty-select"
                        )?.value || "",

                    answers
                };
            });

        return feedback;
    }

    // =========================================================
    // PROGRESS
    // =========================================================

    function updateProgress() {
        const total = selectedSubjects.size;

        if (!total) {
            setProgress(0, "No subjects selected");

            if (submitButton) {
                submitButton.disabled = true;
            }

            return;
        }

        let completed = 0;

        document
            .querySelectorAll(".subject-feedback")
            .forEach((section) => {
                if (validateSubject(section)) {
                    completed++;
                }
            });

        const percentage = Math.round(
            (completed / total) * 100
        );

        setProgress(
            percentage,
            `${completed} of ${total} ${
                total === 1 ? "subject" : "subjects"
            } completed`
        );

        if (submitButton) {
            submitButton.disabled =
                percentage !== 100 || submitting;
        }
    }

    function setProgress(percent, text) {
        if (progressPercent) {
            progressPercent.textContent =
                `${percent}%`;
        }

        if (progressFill) {
            progressFill.style.width =
                `${percent}%`;

            progressFill.setAttribute(
                "aria-valuenow",
                String(percent)
            );
        }

        if (progressText) {
            progressText.textContent = text;
        }
    }

    // =========================================================
    // SUBMIT
    // =========================================================

    async function submitAllFeedback(event) {
        event.preventDefault();

        if (submitting) return;

        if (!validateAllSubjects()) return;

        const feedback = collectFeedback();

        if (!Object.keys(feedback).length) {
            showMessage(
                "⚠️ No feedback selected.",
                "error"
            );

            return;
        }

        submitting = true;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
                "⏳ Submitting...";
        }

        try {
            const response = await fetch(
                "/feedback/submit-all",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        feedback
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (
                    data.code ===
                    "ALREADY_SUBMITTED"
                ) {
                    showAlreadySubmitted(
                        data.message
                    );

                    submitting = false;
                    return;
                }

                throw new Error(
                    data.message ||
                        "Failed to submit feedback"
                );
            }

            // -------------------------------------------------
            // SUCCESS INFORMATION
            // -------------------------------------------------

            const facultyNames = [
                ...document.querySelectorAll(
                    ".subject-feedback .faculty-select"
                )
            ]
                .map(
                    (select) =>
                        select.options[
                            select.selectedIndex
                        ]?.textContent?.trim()
                )
                .filter(
                    (name) =>
                        name &&
                        name !== "Select Faculty"
                );

            const uniqueFacultyNames = [
                ...new Set(facultyNames)
            ];

            const successInfo = {
                cycleName:
                    data.cycle?.name ||
                    "Current Feedback Cycle",

                facultyNames:
                    uniqueFacultyNames,

                submittedAt:
                    new Date().toISOString()
            };

            // Store it for the student dashboard popup.
            sessionStorage.setItem(
                "feedbackSuccess",
                JSON.stringify(successInfo)
            );

            showMessage(
                "✅ Feedback submitted successfully!",
                "success"
            );

            // -------------------------------------------------
            // REDIRECT
            // -------------------------------------------------

            if (data.redirect) {
                setTimeout(() => {
                    window.location.href =
                        data.redirect;
                }, 700);
            }
        } catch (error) {
            console.error(
                "Submit error:",
                error
            );

            submitting = false;

            showMessage(
                `❌ ${
                    error.message ||
                    "Failed to submit feedback."
                }`,
                "error"
            );

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent =
                    "✅ Submit All Feedback";
            }
        }
    }

    // =========================================================
    // SUBMISSION STATUS
    // =========================================================

    async function checkSubmissionStatus() {
        try {
            const response = await fetch(
                "/feedback/status",
                {
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (
                data.success &&
                Array.isArray(data.history) &&
                data.history.length
            ) {
                showAlreadySubmitted(
                    "You have already submitted feedback."
                );
            }
        } catch (error) {
            console.warn(
                "Could not check feedback status:",
                error
            );
        }
    }

    function showAlreadySubmitted(message) {
        if (!alreadySubmittedMessage) return;

        alreadySubmittedMessage.style.display =
            "flex";

        alreadySubmittedMessage.innerHTML = `
            <div class="notice-icon">✅</div>

            <div class="notice-content">
                <h2>Feedback Already Submitted</h2>

                <p>${message}</p>

                <p>
                    Thank you for your feedback! 🙏
                </p>
            </div>
        `;

        if (submitButton) {
            submitButton.disabled = true;
        }

        subjectButtons.forEach((button) => {
            button.disabled = true;
        });
    }

    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(message, type = "info") {
        let box = $("feedback-message");

        if (!box) {
            box = document.createElement("div");

            box.id = "feedback-message";
            box.className = "notice-card";

            const main =
                document.querySelector(
                    "main.feedback-container"
                );

            if (main) {
                main.prepend(box);
            }
        }

        box.style.display = "flex";
        box.dataset.type = type;

        const icon =
            type === "success"
                ? "✅"
                : type === "error"
                ? "⚠️"
                : "ℹ️";

        box.innerHTML = `
            <div class="notice-icon">
                ${icon}
            </div>

            <div class="notice-content">
                <p>${message}</p>
            </div>
        `;

        box.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        clearTimeout(box._hideTimer);

        box._hideTimer = setTimeout(() => {
            box.style.display = "none";
        }, 5000);
    }

    // =========================================================
    // NAVIGATION
    // =========================================================

    $("back-dashboard-btn")?.addEventListener(
        "click",
        () => {
            window.location.href =
                "/dashboard/student-dashboard.html";
        }
    );

    $("logout-btn")?.addEventListener(
        "click",
        async () => {
            try {
                await fetch("/student/logout", {
                    method: "POST",
                    credentials: "include"
                });
            } catch (error) {
                console.warn(
                    "Logout request failed:",
                    error
                );
            }

            sessionStorage.removeItem(
                "feedbackSuccess"
            );

            window.location.href =
                "/auth/student.html";
        }
    );

    // =========================================================
    // DARK MODE
    // =========================================================

    function applyDarkMode(enabled) {
        document.body.classList.toggle(
            "dark-mode",
            enabled
        );

        document.body.classList.toggle(
            "dark",
            enabled
        );

        document.documentElement.classList.toggle(
            "dark",
            enabled
        );

        document.documentElement.dataset.theme =
            enabled ? "dark" : "light";

        localStorage.setItem(
            "darkMode",
            enabled ? "dark" : "light"
        );
    }

    $("dark-mode-btn")?.addEventListener(
        "click",
        () => {
            const enabled =
                !document.body.classList.contains(
                    "dark-mode"
                );

            applyDarkMode(enabled);
        }
    );

    // =========================================================
    // SUBJECT BUTTONS
    // =========================================================

    subjectButtons.forEach((button) => {
        button.addEventListener("click", () => {
            toggleSubject(
                button.dataset.subject
            );
        });
    });

    selectAllButton?.addEventListener(
        "click",
        () => {
            SUBJECT_ORDER.forEach((code) => {
                selectedSubjects.add(code);
            });

            updateSubjectButtons();
            renderForms();
            updateProgress();
        }
    );

    clearAllButton?.addEventListener(
        "click",
        () => {
            selectedSubjects.clear();
            completedSubjects.clear();

            updateSubjectButtons();
            renderForms();
            updateProgress();
        }
    );

    // =========================================================
    // FORM SUBMISSION
    // =========================================================

    feedbackForm?.addEventListener(
        "submit",
        submitAllFeedback
    );

    // =========================================================
    // INITIAL STATE
    // =========================================================

    applyDarkMode(
        localStorage.getItem("darkMode") === "dark"
    );

    if (cycleStatus) {
        cycleStatus.textContent = "Active";
    }

    if (submitButton) {
        submitButton.disabled = true;
    }

    updateSubjectButtons();
    updateProgress();

    // Load faculty after the page is ready.
    loadFaculty();

    // Check whether this student already submitted.
    checkSubmissionStatus();

    console.log(
        "📝 Feedback system loaded."
    );
});