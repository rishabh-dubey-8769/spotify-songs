const express=require('express')
const cookieParser=require('cookie-parser')
const authRoutes=require('./routes/auth.routes')
const musicRoutes=require('./routes/music.routes')
const cors=require("cors");

const app=express()

app.use(cors({
  origin: process.env.FRONTEND_URL,
  // origin: true,
  credentials: true
}));


app.use(express.json())
app.use(cookieParser())
app.use('/api/auth',authRoutes)
app.use('/api/music',musicRoutes)

module.exports=app

