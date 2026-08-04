/* =====================================================
   ALL FEEDBACK PAGE JAVASCRIPT
===================================================== */


// ===============================
// SECURITY FUNCTION
// Prevent HTML injection
// ===============================

function escapeHTML(text){

    if(!text){
        return "";
    }


    return text
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}





// ===============================
// LOAD ALL FEEDBACK
// ===============================

async function loadAllFeedback(){


    try{


        const response =
        await fetch("/faculty/feedback");



        const data =
        await response.json();




        const box =
        document.getElementById(
            "feedback-container"
        );



        if(!box){

            console.error(
                "Feedback container not found"
            );

            return;

        }




        // Session expired

        if(!data.success){


            window.location.replace(
                "/auth/faculty.html"
            );


            return;

        }






        // No feedback


        if(data.feedback.length === 0){


            box.innerHTML = `


            <div class="empty-card">


            No feedback available yet.


            </div>


            `;


            return;

        }






        // Clear loading


        box.innerHTML = "";






        // Create feedback cards


        data.feedback.forEach(item=>{


            const date =
            new Date(item.created_at);



            box.innerHTML += `


            <div class="feedback-card">



                <h3>

                📚 Subject:
                ${escapeHTML(item.subject)}

                </h3>




                <div class="rating-box">


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


                </div>





                <div class="feedback-date">


                    <span>

                    📅 
                    ${date.toLocaleDateString()}

                    </span>



                    <span>

                    ⏰ 
                    ${date.toLocaleTimeString([],{

                        hour:"2-digit",

                        minute:"2-digit"

                    })}

                    </span>


                </div>






                <div class="comment">


                    "${escapeHTML(item.comments)}"


                </div>



            </div>


            `;



        });




    }



    catch(error){


        console.error(

            "All Feedback Error:",

            error

        );



        const box =
        document.getElementById(
            "feedback-container"
        );



        if(box){


            box.innerHTML = `


            <div class="empty-card">


            ⚠️ Failed to load feedback.


            </div>


            `;


        }


    }


}






// ===============================
// START
// ===============================


loadAllFeedback();