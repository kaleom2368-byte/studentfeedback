const express = require("express");

const router = express.Router();

const db = require("../db");



// =======================
// ADD FACULTY
// =======================

router.post("/add-faculty",(req,res)=>{


    const {

        faculty_id,
        name,
        email,
        password,
        department

    } = req.body;



    const sql = `

    INSERT INTO faculty

    (
        faculty_id,
        name,
        email,
        password,
        department
    )

    VALUES (?,?,?,?,?)

    `;



    db.query(

        sql,

        [
            faculty_id,
            name,
            email,
            password,
            department
        ],


        (err,result)=>{


            if(err){


                console.log(err);



                return res.send(`

                <h2>
                ❌ Faculty Added Failed
                </h2>

                <p>
                ${err.message}
                </p>

                <a href="/admin/add-faculty.html">
                Try Again
                </a>

                `);


            }



            res.send(`

            <!DOCTYPE html>

            <html>

            <head>

            <title>
            Faculty Added
            </title>

            <meta http-equiv="refresh" content="2;url=/admin/add-faculty.html">

            </head>


            <body>


            <h2>
            ✅ Faculty Added Successfully
            </h2>


            <p>
            Redirecting...
            </p>


            </body>


            </html>


            `);


        }


    );



});





module.exports = router;
