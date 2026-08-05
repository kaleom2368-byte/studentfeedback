const express = require("express");
const router = express.Router();

const db = require("../db");


// =====================================
// GET FACULTY LIST FOR FEEDBACK FORM
// =====================================

router.get("/faculty", (req, res) => {


    const sql = `
        SELECT 
            faculty_id,
            name,
            department
        FROM faculty
    `;


    db.query(sql, (err, result) => {


        if (err) {

            console.error("Faculty Fetch Error:", err);


            return res.status(500).json({

                success: false,

                message: "Unable to fetch faculty"

            });

        }



        res.json({

            success: true,

            faculty: result

        });


    });


});




// =====================================
// SUBMIT FEEDBACK
// =====================================

router.post("/submit", (req, res) => {


    if(!req.session.student){

        return res.status(401).json({

            success:false,

            message:"Student login required"

        });

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

        VALUES

        (?,?,?,?,?,?,?,?)

    `;

const values = [

    req.session.student.student_id,

    faculty_id,

    department,

    subject,

    Number(teaching),

    Number(communication),

    Number(behaviour),

    comments

];


    db.query(sql, values, (err, result) => {


        if (err) {


            console.error(
                "Feedback Insert Error:",
                err
            );


            return res.status(500).json({

                success:false,

                message:"Failed to submit feedback"

            });


        }



        console.log(
            "Feedback saved:",
            result.insertId
        );



        res.json({

            success:true,

            redirect:"/dashboard/student-dashboard.html?feedback=success"

        });



    });


});




// =====================================
// FEEDBACK HISTORY
// =====================================

router.get("/history", (req, res) => {


    res.json({

        success:true,

        feedback:[]

    });


});

// =====================================
// FEEDBACK STATUS TEST
// =====================================

router.get("/status",(req,res)=>{


    console.log("🔥 STATUS ROUTE HIT");


    if(!req.session.student){

        console.log("❌ No student session");


        return res.json({

            success:false,

            message:"Not Logged In"

        });

    }



    console.log(
        "Logged Student:",
        req.session.student.student_id
    );



    const student_id = req.session.student.student_id;



    const sql = `

        SELECT

            feedback.faculty_id,

            feedback.subject,

            feedback.submitted_at,

            faculty.name AS faculty_name

        FROM feedback

        JOIN faculty

        ON feedback.faculty_id = faculty.faculty_id

        WHERE feedback.student_id = ?

        ORDER BY feedback.submitted_at DESC

    `;



    db.query(sql,[student_id],(err,result)=>{


        if(err){

            console.error(
                "Status Query Error:",
                err
            );


            return res.json({

                success:false

            });

        }



        console.log(
            "Feedback Found:",
            result
        );



        res.json({

            success:true,

            count:result.length,

            history:result

        });



    });



});

module.exports = router;