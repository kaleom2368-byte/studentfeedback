const db = require("./db");


const sql = `
ALTER TABLE feedback
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
`;


db.query(sql, (err,result)=>{

    if(err){

        console.log("❌ Error:");
        console.log(err);

    }
    else{

        console.log("✅ Date column added successfully");

    }


    process.exit();

});