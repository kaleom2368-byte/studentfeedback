require("dotenv").config();

const db = require("./db");


const sql = `
SELECT *
FROM faculty
LIMIT 10
`;


db.query(sql,(err,result)=>{

    if(err){

        console.error("ERROR:",err);
        process.exit();

    }


    console.table(result);

    process.exit();

});