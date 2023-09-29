const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://nithink24770:GowthamandNithin@cluster0.2fyhwiq.mongodb.net/Book_Management');

const db = mongoose.connection;

db.on('error',(error)=>{
    console.log('error to connecting with database')
})

db.once('open',function(){
    console.log('Successfully connected to database');
})