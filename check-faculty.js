const db = require("./db");

db.query("DESCRIBE faculty", (err, result) => {

    if(err){
        console.log(err);
        process.exit();
    }

    console.table(result);

    process.exit();

});