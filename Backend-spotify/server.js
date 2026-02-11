require('dotenv').config()
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]); //->vvi to add in server.js worked successfully.
const app=require('./src/app')
const connectDB = require('./src/db/db')
connectDB()
app.listen(3000,()=>{
    console.log("Hii, server is running on port: 3000.")
})
