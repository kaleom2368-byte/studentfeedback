const express = require("express");
const router = express.Router();

const db = require("../db");


// ======================================
// GET FACULTY BY STUDENT DEPARTMENT
// ======================================

router.get("/", (req,res)=>{


    if(!req.session.student){

        return res.json({

            success:false,

            message:"Not Logged In"

        });

    }



    const department = req.session.student.department;



    const sql = `

       SELECT

    faculty_id,
    name,
    email,
    subject

FROM faculty

        WHERE department = ?

        ORDER BY name

    `;



    db.query(sql,[department],(err,result)=>{


        if(err){

            console.error("Faculty Directory Error:",err);


            return res.json({

                success:false

            });

        }



        res.json({

            success:true,

            faculty:result

        });



    });



});



module.exports = router;