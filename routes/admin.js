const express = require("express");

const router = express.Router();


// Admin Login

router.post("/login",(req,res)=>{


    const { adminid,password } = req.body;


    console.log("Admin login attempt:",adminid);



    // Database authentication will be added later


    res.redirect("/admin/admin-dashboard.html");


});




// Admin Logout

router.get("/logout",(req,res)=>{


    if(req.session){


        req.session.destroy(()=>{


            res.redirect("/auth/adminfile.html");


        });


    }
    else{


        res.redirect("/auth/adminfile.html");


    }


});




// Admin Information

router.get("/info",(req,res)=>{


    res.json({

        success:true,

        message:"Admin route working"

    });


});



module.exports = router;