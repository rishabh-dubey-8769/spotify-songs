const sendOTP = require("../services/mail.service");
const userModel=require('../models/user.model')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function sendOtpRegister(req,res){
  const {email} = req.body;

  const user = await userModel.findOne({email});

  // ✅ limit 3 per hour
  if(user && user.otpLastAttempt){
    const diff = Date.now() - user.otpLastAttempt.getTime();

    if(diff < 60*60*1000 && user.otpAttempts >= 3){
      return res.status(429).json({
        message:"Max OTP attempts reached. Try after 1 hour."
      });
    }
  }

  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const expiry = new Date(Date.now()+10*60*1000);

  await sendOTP(email, otp);

  await userModel.updateOne(
    {email, isVerified:false},
    {
      otp,
      otpExpiry: expiry,
      otpAttempts: user ? (user.otpAttempts||0)+1 : 1,
      otpLastAttempt:new Date()
    },
    {upsert:true}
  );

  res.json({message:"OTP sent to email"});
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function registerUser(req,res){
    const {username,email,password,role='user'}=req.body;

    // ⚠️ STRICT NITP EMAIL CHECK
    const nitpEmailCheck=/^[a-zA-Z0-9._%+-]+(\.ee|\.me)@nitp\.ac\.in$/;
    if(!nitpEmailCheck.test(email)){
        return res.status(400).json({
            message:"Register through NITP Email Id only."
        });
    }

    const existing=await userModel.findOne({email});
    if(existing && existing.isVerified){
        return res.status(409).json({message:"User already exists"});
    }

    // 🔥 OTP GENERATE
    const otp=Math.floor(100000+Math.random()*900000).toString();

    const hash=await bcrypt.hash(password,10);

    const user=await userModel.findOneAndUpdate(
        {email},
        {
            username,
            password:hash,
            role,
            otp,
            otpExpiry:new Date(Date.now()+10*60*1000),
            isVerified:false
        },
        {upsert:true,new:true}
    );

    // 🔥 SEND OTP EMAIL
    const sendOTP=require("../services/mail.service");
    await sendOTP(email,otp);

    return res.status(200).json({
        message:"OTP sent to email. Verify to complete registration."
    });
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function verifyOtpRegister(req,res){
    const {email,otp}=req.body;

    const user=await userModel.findOne({email});

    if(!user || user.otp!==otp || user.otpExpiry<new Date()){
        return res.status(400).json({message:"Invalid or expired OTP"});
    }

    user.isVerified=true;
    user.otp=null;
    await user.save();

    // 🔥 NOW LOGIN COOKIE
    const token=jwt.sign(
        {id:user._id,role:user.role},
        process.env.JWT_SECRET
    );

    res.cookie('token', token, {
        httpOnly:true,
        secure:true,
        sameSite:"none",
        maxAge:7*24*60*60*1000
    });

    return res.json({
        message:"Registration successful",
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }
    });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function loginUser(req,res){
    const {username,email,password}=req.body
    // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️ STRICT NITP EMAIL CHECK
    const nitpEmailCheck=/^[a-zA-Z0-9._%+-]+(\.ee|\.me)@nitp\.ac\.in$/;
    
    if(email && !nitpEmailCheck.test(email)){
        return res.status(400).json({
            message:"Login through NITP Email Id only."
        });
    }

    const user=await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(!user){
        return res.status(401).json({
            message:'User not found.Please register first'
        })
    }

    if(!user.isVerified){
        return res.status(403).json({
            message:"Please verify OTP before login"
        });
    }
  
    const isPasswordValid=await bcrypt.compare(password,user.password)
    if(!isPasswordValid){
        return res.status(401).json({
            message:'Invalid password'
        })
    }

    const token=jwt.sign({
        id:user._id,
        role:user.role
    },process.env.JWT_SECRET)

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        message:'User logged in successfully',
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }
    })
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function sendOtpForgot(req,res){
  const {email} = req.body;

  const user = await userModel.findOne({email});
  if(!user) return res.status(404).json({message:"No user"});

  const otp = Math.floor(100000 + Math.random()*900000).toString();

  user.otp=otp;
  user.otpExpiry=new Date(Date.now()+10*60*1000);

  await user.save();

  await sendOTP(email,otp);

  res.json({message:"OTP sent"});
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function resetPassword(req,res){
  const {email,otp,newPassword} = req.body;

  const user = await userModel.findOne({email});

  if(!user || user.otp!==otp || user.otpExpiry<new Date()){
    return res.status(400).json({message:"Invalid OTP"});
  }

  user.password=await bcrypt.hash(newPassword,10);
  user.otp=null;

  await user.save();

  res.json({message:"Password updated"});
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function logoutUser(req,res){
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    
    return res.status(200).json({
        message:'User logged out successfully'
    })
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function getUserCount(req,res){
  try{
    const count = await userModel.countDocuments();
    res.status(200).json({count});
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function getMe(req,res){
  try{
    const token = req.cookies.token;

    if(!token){
      return res.status(401).json({message:"Not logged in"});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id)
      .select("-password");

    if(!user){
      return res.status(404).json({message:"User not found"});
    }

    res.status(200).json({user});

  }catch(err){
    res.status(401).json({message:"Invalid token"});
  }
}



module.exports={registerUser,loginUser,logoutUser,getUserCount,getMe,sendOtpRegister,verifyOtpRegister,sendOtpForgot,resetPassword}









