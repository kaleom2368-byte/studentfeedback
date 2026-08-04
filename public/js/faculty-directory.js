fetch("/faculty-directory")

.then(response => response.json())

.then(data => {


    console.log("Faculty Data:", data);


    if(!data.success){

        document.getElementById("faculty-container").innerHTML =
        `
        <div class="error-box">
            Unable to load faculty.
        </div>
        `;

        return;

    }



    document.getElementById("department-title").innerHTML =
    data.department + " Department";



    const container =
    document.getElementById("faculty-container");



    container.innerHTML = "";



    data.faculty.forEach(faculty => {


        container.innerHTML +=
`

<div class="faculty-card">


    <h3>
        👨‍🏫 Name: ${faculty.name}
    </h3>


    <p>
        📚 Subject: ${faculty.subject || "Not Assigned"}
    </p>


    <p>
        📧 Email: ${faculty.email}
    </p>


</div>

`;


    });



})

.catch(error => {


    console.error(
        "Faculty Directory Error:",
        error
    );


    document.getElementById("faculty-container").innerHTML =
    `
    <div class="error-box">
        Server Error Loading Faculty
    </div>
    `;


});