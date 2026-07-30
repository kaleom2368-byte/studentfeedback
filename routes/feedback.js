const express = require("express");

const router = express.Router();

const db = require("../db");



// =======================
// SUBMIT FEEDBACK
// =======================

router.post("/submit",(req,res)=>{


    const {

        faculty_id,
        department,
        subject,
        teaching,
        communication,
        behaviour,
        comments

    } = req.body;



    const sql = `

    INSERT INTO feedback

    (
        faculty_id,
        department,
        subject,
        teaching,
        communication,
        behaviour,
        comments
    )

    VALUES (?,?,?,?,?,?,?)

    `;



    db.query(

        sql,

        [

            faculty_id,
            department,
            subject,
            teaching,
            communication,
            behaviour,
            comments

        ],


        (err,result)=>{


            if(err){

                console.log(err);

                return res.send("Feedback submission failed");

            }



            res.send(`

            <!DOCTYPE html>

            <html>

            <head>

            <title>Feedback Submitted</title>

            <link rel="stylesheet" href="/css/message.css">

            </head>


            <body>


            <div class="message-box">


            <h2 class="success">
            ✅ Feedback Submitted
            </h2>


            <p>
            Thank you for your response.
            </p>


            <a href="/dashboard/student-dashboard.html">
            Back to Dashboard
            </a>


            </div>


            </body>


            </html>

            `);



        }


    );


});





module.exports = router;