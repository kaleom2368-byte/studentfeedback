const db = require("./db");


db.query(
    "DESCRIBE feedback",
    (err,result)=>{

        if(err){

            console.log(err);
            process.exit();

        }


        console.table(result);

        process.exit();

    }
);