const express = require("express");

const router = express.Router();

const db = require("../db");



// =======================
// GET FACULTY LIST
// =======================

router.get("/faculty",(req,res)=>{


    const sql = `

    SELECT 
    faculty_id,
    name,
    department

    FROM faculty

    `;


    db.query(sql,(err,result)=>{


        if(err){

            console.log(err);

            return res.status(500).json({

                error:"Database Error"

            });

        }


        res.json(result);


    });


});






// =======================
// SUBMIT FEEDBACK
// =======================

router.post("/submit",(req,res)=>{


    // Check student login

    if(!req.session.student){

        return res.send(`

        <h2>
        Please Login First
        </h2>

        <a href="/student.html">
        Login
        </a>

        `);

    }



    const {

        faculty_id,
        department,
        subject,
        teaching,
        communication,
        behaviour,
        comments

    } = req.body;



    const student_id = req.session.student.student_id;




    const sql = `

    INSERT INTO feedback

    (
        student_id,
        faculty_id,
        department,
        subject,
        teaching,
        communication,
        behaviour,
        comments
    )

    VALUES (?,?,?,?,?,?,?,?)

    `;




    db.query(

        sql,

        [

            student_id,
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


                return res.send(`

                <h2>
                ❌ Feedback Submission Failed
                </h2>


                <p>
                ${err.message}
                </p>


                <a href="/feedback.html">
                Try Again
                </a>

                `);

            }




            res.send(`

            <!DOCTYPE html>

            <html>

            <head>

            <title>
            Success
            </title>


            <meta http-equiv="refresh" content="2;url=/dashboard/student-dashboard.html">


            </head>


            <body>


            <h2>
            ✅ Feedback Submitted Successfully
            </h2>


            <p>
            Redirecting to Dashboard...
            </p>


            </body>


            </html>

            `);



        }


    );


});








// =======================
// GET STUDENT FEEDBACK HISTORY
// =======================

router.get("/history",(req,res)=>{


    // Check student login

    if(!req.session.student){

        return res.send(`

        <h2>
        Please Login First
        </h2>


        <a href="/student.html">
        Login
        </a>

        `);

    }




    const student_id = req.session.student.student_id;



    const sql = `

    SELECT

    feedback.*,

    faculty.name AS faculty_name


    FROM feedback


    JOIN faculty

    ON feedback.faculty_id = faculty.faculty_id


    WHERE feedback.student_id = ?


    ORDER BY feedback.submitted_at DESC

    `;




    db.query(

        sql,

        [student_id],


        (err,result)=>{


            if(err){

                console.log(err);


                return res.status(500).json({

                    error:"Database Error"

                });

            }



            res.json(result);



        }


    );



});





module.exports = router;
