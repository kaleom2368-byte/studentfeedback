// =====================================
// LOAD FEEDBACK STATUS
// =====================================


fetch("/feedback/status")


.then(response => response.json())


.then(data => {


    console.log("Feedback Status:", data);



    if(!data.success){


        alert("Unable to load feedback status");


        return;


    }



    // Total feedback count

    document.getElementById("total-feedback").innerHTML =
    data.count;



    // Faculty reviewed

    const uniqueFaculty = [
    ...new Set(data.history.map(item => item.faculty_id))
];

document.getElementById("faculty-reviewed").innerHTML =
uniqueFaculty.length;



    const historyBox =
    document.getElementById("history");



    historyBox.innerHTML = "";



    if(data.history.length === 0){


        historyBox.innerHTML = `

        <div class="empty">

        No feedback submitted yet.

        </div>

        `;


        return;


    }




    data.history.forEach(item=>{


        historyBox.innerHTML += `


        <div class="feedback-item">


            <h3>
            👨‍🏫 ${item.faculty_name}
            </h3>


            <p>
            📚 Subject:
            ${item.subject}
            </p>


            <p>
            📅 Date:
            ${new Date(item.submitted_at)
            .toLocaleDateString()}
            </p>


            <span>
            ✅ Submitted
            </span>


        </div>


        `;


    });



})


.catch(error=>{


    console.error(
        "Feedback Status Error:",
        error
    );


});