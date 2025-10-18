const mongoose = require("mongoose");

async function ConnectDB(){
    try {
        mongoose.connect(process.env.URI).then(()=>{
            console.log("database connected");
        }).catch((err)=>{
            console.log(err.message);
        })
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = ConnectDB;