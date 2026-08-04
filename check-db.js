const db = require("./db");

db.query("SHOW TABLES", (err, result) => {

    if(err){
        console.log(err);
        process.exit();
    }

    console.log(result);

    process.exit();

});
