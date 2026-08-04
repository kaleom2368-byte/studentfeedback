document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll("#dark-mode-btn");

    // Load saved theme
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }

    // Update button text
    function updateButtonText() {

        buttons.forEach(button => {

            if (document.body.classList.contains("dark")) {

                button.innerHTML = "☀️ Light Mode";

            } else {

                button.innerHTML = "🌙 Dark Mode";

            }

        });

    }

    updateButtonText();

    // Toggle theme
    buttons.forEach(button => {

        button.addEventListener("click", () => {

            document.body.classList.toggle("dark");

            localStorage.setItem(
                "theme",
                document.body.classList.contains("dark")
                    ? "dark"
                    : "light"
            );

            updateButtonText();

        });

    });

});