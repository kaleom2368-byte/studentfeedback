const express = require("express");
const router = express.Router();

const db = require("../db");



// =======================
// STUDENT LOGIN
// =======================

router.post("/login",(req,res)=>{


    const {student_id,password}=req.body;


    const sql =
    "SELECT * FROM students WHERE student_id=? AND password=?";


    db.query(sql,[student_id,password],(err,result)=>{


        if(err){

            console.log(err);

            return res.send("Database Error");

        }



        if(result.length>0){


            req.session.student={

                student_id:result[0].student_id,

                name:result[0].name,

                email:result[0].email,

                department:result[0].department,

                year:result[0].year,

                division:result[0].division

            };



            res.send(`

            <!DOCTYPE html>

            <html>

            <head>

            <title>Login Successful</title>

            <link rel="stylesheet" href="/css/message.css">

            <meta http-equiv="refresh" content="2;url=/dashboard/student-dashboard.html">

            </head>


            <body>

            <div class="message-box">


            <h2 class="success">
            ✅ Login Successful
            </h2>


            <p>
            Redirecting to dashboard...
            </p>


            </div>

            </body>

            </html>

            `);



        }
        else{


            res.send(`

            <h2>❌ Login Failed</h2>

            <p>Invalid Student ID or Password</p>

            <a href="/student.html">
            Try Again
            </a>

            `);


        }


    });


});







// =======================
// STUDENT REGISTER
// =======================

router.post("/register",(req,res)=>{


    const {

        student_id,
        name,
        email,
        password,
        department,
        year,
        division

    }=req.body;



    const sql=`

    INSERT INTO students

    (
    student_id,
    name,
    email,
    password,
    department,
    year,
    division
    )

    VALUES(?,?,?,?,?,?,?)

    `;



    db.query(

        sql,

        [
            student_id,
            name,
            email,
            password,
            department,
            year,
            division
        ],


        (err,result)=>{


            if(err){

                console.log(err);


                return res.send(`

                <h2>Registration Failed</h2>

                <pre>${err}</pre>

                `);


            }



            res.redirect("/student.html");


        }


    );


});







// =======================
// GET STUDENT DATA
// =======================

router.get("/student-info",(req,res)=>{


    if(!req.session.student){


        return res.json({

            logged:false

        });


    }



    res.json({

        logged:true,

        student:req.session.student

    });



});





module.exports = router;