const userModel=require('../models/user.model')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')

async function registerUser(req,res){
    const {username,email,password,role='user'}=req.body
    // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️ STRICT NITP EMAIL CHECK
    const nitpEmailCheck=/^[a-zA-Z0-9._%+-]+(\.ee|\.me)@nitp\.ac\.in$/;
    
    if(!nitpEmailCheck.test(email)){
        return res.status(400).json({
            message:"Register through NITP Email Id only."
        });
    }

    const isUserAlreadyExists=await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(isUserAlreadyExists){
        return res.status(409).json({
            message:'User already exists'
        })
    }

    const hash=await bcrypt.hash(password,10)

    const user=await userModel.create({
        username,
        email,
        password:hash,
        role
    })

    const token=jwt.sign({
        id:user._id,
        role:user.role
    },process.env.JWT_SECRET)

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,      // required for HTTPS (Render)
        sameSite: "none",  // allow cross-site cookies
        maxAge: 7 * 24 * 60 * 60 * 1000 // optional: 7 days
    });

    return res.status(201).json({
        message:'User registered successfully',
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }
    })
}

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

async function getUserCount(req,res){
  try{
    const count = await userModel.countDocuments();
    res.status(200).json({count});
  }catch(err){
    res.status(500).json({message:"Server error"});
  }
}


module.exports={registerUser,loginUser,logoutUser,getUserCount}




