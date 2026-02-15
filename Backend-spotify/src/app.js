const express=require('express')
const cookieParser=require('cookie-parser')
const authRoutes=require('./routes/auth.routes')
const musicRoutes=require('./routes/music.routes')
const cors=require("cors");

const app=express()

// app.use(cors({
//   origin: [
//     "http://127.0.0.1:5500",
//     "http://localhost:5500",
//     "https://spotify-songs-frontend.onrender.com"
//   ],
//   credentials: true
// }));

app.use(cors({
  origin: process.env.FRONTEND_URL, // from .env
  credentials: true
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});



app.use(express.json())
app.use(cookieParser())
app.use('/api/auth',authRoutes)
app.use('/api/music',musicRoutes)

module.exports=app



