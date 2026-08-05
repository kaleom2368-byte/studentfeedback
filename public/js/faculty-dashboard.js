/* =====================================================
   FACULTY DASHBOARD JAVASCRIPT
===================================================== */


/* ================= CHART VARIABLES ================= */

let ratingChartInstance = null;
let barChartInstance = null;



/* ================= LOAD FACULTY INFO ================= */


async function loadFaculty(){

    try{

        const response = await fetch("/faculty/info");

        const data = await response.json();


        if(!data.success){

            window.location.replace("/auth/faculty.html");
            return;

        }


        const faculty = data.faculty;


        document.getElementById("welcome").textContent =
        "Welcome, " + faculty.name + " 👋";


        document.getElementById("faculty-id").textContent =
        faculty.faculty_id;


        document.getElementById("faculty-name").textContent =
        faculty.name;


        document.getElementById("faculty-email").textContent =
        faculty.email;


        document.getElementById("faculty-department").textContent =
        faculty.department;


        document.getElementById("faculty-subject").textContent =
        faculty.subject || "Not Assigned";


    }

    catch(error){

        console.error(
            "Faculty Info Error:",
            error
        );

        window.location.replace("/auth/faculty.html");

    }

}




/* ================= NUMBER ANIMATION ================= */


function animateNumber(id,target){

    const element =
    document.getElementById(id);


    if(!element)
        return;


    let current = 0;


    const timer = setInterval(()=>{


        current++;


        element.textContent=current;


        if(current >= target){

            clearInterval(timer);

        }


    },30);


}




/* ================= PROGRESS BAR ================= */


function setProgress(bar,text,value){


    const progress =
    document.getElementById(bar);


    const percent =
    document.getElementById(text);



    if(progress){

        progress.style.width =
        value + "%";

    }



    if(percent){

        percent.textContent =
        value + "%";

    }


}




/* ================= LOAD FEEDBACK ================= */


async function loadFeedback(){


try{


const response =
await fetch("/faculty/feedback");


const data =
await response.json();



if(!data.success)
return;



/* STATISTICS */


animateNumber(
"total-feedback",
data.total
);


animateNumber(
"teaching",
data.teaching
);


animateNumber(
"communication",
data.communication
);


animateNumber(
"behaviour",
data.behaviour
);



let overall = Math.round(

(
data.teachAverage +
data.commAverage +
data.behaveAverage

)/3

);



animateNumber(
"overall-rating",
overall
);





/* PROGRESS USING REAL DATA */


setProgress(
"teach-progress",
"teach-percent",
Math.round((data.teachAverage/5)*100)
);



setProgress(
"comm-progress",
"comm-percent",
Math.round((data.commAverage/5)*100)
);



setProgress(
"behave-progress",
"behave-percent",
Math.round((data.behaveAverage/5)*100)
);





/* REAL TIME ANALYSIS */


const analytics =
document.getElementById(
"real-time-analysis"
);



if(analytics){


analytics.innerHTML = `


<div class="analysis-card">

<h3>📚 Teaching</h3>

<p>
⭐ Average:
<b>${data.teachAverage}/5</b>
</p>

<p>
👥 Responses:
<b>${data.responses}</b>
</p>


</div>



<div class="analysis-card">

<h3>💬 Communication</h3>

<p>
⭐ Average:
<b>${data.commAverage}/5</b>
</p>

<p>
👥 Responses:
<b>${data.responses}</b>
</p>


</div>




<div class="analysis-card">

<h3>🤝 Behaviour</h3>

<p>
⭐ Average:
<b>${data.behaveAverage}/5</b>
</p>


<p>
👥 Responses:
<b>${data.responses}</b>
</p>


</div>


`;

}




/* CREATE CHARTS */


createCharts(data);





/* FEEDBACK LIST */


const box =
document.getElementById(
"feedback-list"
);



if(!box)
return;



if(data.feedback.length===0){


box.innerHTML = `

<div class="empty-card">

No feedback available yet.

</div>

`;


return;


}




box.innerHTML="";



data.feedback
.slice(0,3)
.forEach(item=>{


box.innerHTML += `


<div class="feedback-card">


<h3>
📚 Subject = ${item.subject}
</h3>


<p>
📖 Teaching:
${"⭐".repeat(item.teaching)}
</p>


<p>
💬 Communication:
${"⭐".repeat(item.communication)}
</p>


<p>
🤝 Behaviour:
${"⭐".repeat(item.behaviour)}
</p>



<p>

"${item.comments}"

</p>


<p class="feedback-date">

📅 ${new Date(item.submitted_at)
.toLocaleDateString()}

</p>



</div>


`;


});
// ================= VIEW ALL BUTTON =================

if(data.feedback.length > 3){

box.innerHTML += `

<div class="view-all-box">

<a href="/dashboard/all-feedback.html">

View All Feedback →

</a>

</div>

`;

}



}

catch(error){

console.error(
"Feedback Error:",
error
);


}


}





/* ================= CHART CREATION ================= */

function createCharts(data){

    const ratingCanvas = document.getElementById("ratingChart");
    const barCanvas = document.getElementById("barChart");


    if(!ratingCanvas || !barCanvas){
        console.log("Chart canvas missing");
        return;
    }


    if(ratingChartInstance){
        ratingChartInstance.destroy();
    }

    if(barChartInstance){
        barChartInstance.destroy();
    }



    ratingChartInstance = new Chart(ratingCanvas, {

        type: "doughnut",

        data: {

            labels:[
                "Teaching",
                "Communication",
                "Behaviour"
            ],

            datasets:[{

                data:[

                    data.teachAverage,
                    data.commAverage,
                    data.behaveAverage

                ],


                backgroundColor:[

                    "#2563eb",
                    "#3b82f6",
                    "#60a5fa"

                ],


                borderWidth:0,


                hoverOffset:8

            }]

        },


        options:{

            responsive:true,

            maintainAspectRatio:false,


            cutout:"70%",


            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        color:"#cbd5e1"

                    }

                }

            }

        }

    });





    barChartInstance = new Chart(barCanvas,{

        type:"bar",

        data:{

            labels:[

                "Teaching",
                "Communication",
                "Behaviour"

            ],


            datasets:[{

                label:"Average Rating",


                data:[

                    data.teachAverage,
                    data.commAverage,
                    data.behaveAverage

                ],


                backgroundColor:[

                    "#2563eb",
                    "#3b82f6",
                    "#60a5fa"

                ],


                borderRadius:12

            }]

        },


        options:{

            responsive:true,

            maintainAspectRatio:false,


            scales:{

                y:{

                    beginAtZero:true,

                    max:5,


                    ticks:{

                        color:"#94a3b8"

                    }

                },


                x:{

                    ticks:{

                        color:"#94a3b8"

                    }

                }


            },


            plugins:{

                legend:{

                    labels:{

                        color:"#cbd5e1"

                    }

                }

            }


        }


    });



}

/* ================= START ================= */


loadFaculty();

loadFeedback();



window.addEventListener(
"pageshow",
(event)=>{


if(event.persisted){

loadFaculty();

}


});