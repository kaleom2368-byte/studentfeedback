const express = require("express");

const router = express.Router();

const db = require("../db");


// =======================
// FACULTY LOGIN
// =======================

router.post("/login",(req,res)=>{


    const {

        faculty_id,
        password

    } = req.body;



    const sql = `

    SELECT *

    FROM faculty

    WHERE faculty_id=? 
    AND password=?

    `;



    db.query(

        sql,

        [
            faculty_id,
            password
        ],


        (err,result)=>{


            if(err){

                console.log(err);

                return res.send("Database Error");

            }



            if(result.length > 0){


                req.session.faculty = {

                    faculty_id: result[0].faculty_id,

                    name: result[0].name,

                    email: result[0].email,

                    department: result[0].department

                };



                res.send(`

<!DOCTYPE html>

<html>

<head>

<title>
Login Success
</title>


<meta http-equiv="refresh" content="2;url=/faculty-dashboard/faculty-dashboard.html">


<style>

body{

font-family:Arial;

background:#f4f6f9;

height:100vh;

display:flex;

justify-content:center;

align-items:center;

}


.box{

background:white;

padding:40px;

border-radius:15px;

text-align:center;

box-shadow:0 5px 20px rgba(0,0,0,0.2);

}


h2{

color:green;

}


</style>


</head>


<body>


<div class="box">


<h2>
✅ Faculty Login Successful
</h2>


<p>
Welcome ${result[0].name} 👋
</p>


<p>
Department: ${result[0].department}
</p>


<p>
Redirecting to Faculty Dashboard...
</p>


</div>


</body>

</html>

                `);


            }


            else{


                res.send(`

<h2>
❌ Login Failed
</h2>


<p>
Invalid Faculty ID or Password
</p>


<a href="/faculty.html">
Try Again
</a>

                `);


            }


        }


    );


});





// =======================
// GET LOGGED IN FACULTY INFO
// =======================

router.get("/info",(req,res)=>{


    if(!req.session.faculty){

        return res.json({

            logged:false

        });

    }



    res.json({

        logged:true,

        name:req.session.faculty.name,

        faculty_id:req.session.faculty.faculty_id,

        department:req.session.faculty.department

    });


});







// =======================
// GET FACULTY FEEDBACK
// =======================

router.get("/feedback",(req,res)=>{


    if(!req.session.faculty){

        return res.json({

            total:0,

            teaching:0,

            communication:0,

            behaviour:0,

            feedback:[]

        });

    }



    const faculty_id = req.session.faculty.faculty_id;



    const sql = `

    SELECT

    subject,

    teaching,

    communication,

    behaviour,

    comments,

    submitted_at

    FROM feedback

    WHERE faculty_id = ?

    ORDER BY submitted_at DESC

    `;



    db.query(

        sql,

        [faculty_id],


        (err,result)=>{


            if(err){

                console.log(err);

                return res.status(500).json({

                    error:"Database Error"

                });

            }



            let total = result.length;


            let teaching = 0;

            let communication = 0;

            let behaviour = 0;



            result.forEach(item=>{


                teaching += item.teaching;

                communication += item.communication;

                behaviour += item.behaviour;


            });



            if(total > 0){


                teaching = (teaching / total).toFixed(1);

                communication = (communication / total).toFixed(1);

                behaviour = (behaviour / total).toFixed(1);


            }



            res.json({

                total,

                teaching,

                communication,

                behaviour,

                feedback:result

            });


        }


    );


});




// =======================
// FACULTY LOGOUT
// =======================

router.get("/logout",(req,res)=>{


    req.session.destroy((err)=>{


        if(err){

            console.log(err);

            return res.send("Logout Failed");

        }


        res.redirect("/faculty.html");


    });


});



module.exports = router;