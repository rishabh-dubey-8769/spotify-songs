const jwt=require('jsonwebtoken')

async function authArtist(req,res,next){
    const token=req.cookies.token
    if(!token){
        return res.status(401).json({
            message:'Unauthorized access by user'
        })
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if(decoded.role!=="artist"){
            return res.status(403).json({
                message:'Only artists can access.'
            })
        }
        req.user=decoded
        next()
    }
    catch(err){
        return res.status(401).json({
            message:'Unauthorised access.'
        })
    }
}

async function authUser(req,res,next){
    const token=req.cookies.token
    if(!token){
        return res.status(401).json({
            message:'Unauthorized access by user'
        })
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if(decoded.role!=="user"){
            return res.status(403).json({
                message:'Only users can access.'
            })
        }
        req.user=decoded
        next()
    }
    catch(err){
        return res.status(401).json({
            message:'Unauthorised access.'
        })
    }
}

async function authUserOrArtist(req,res,next){
  const token=req.cookies.token;

  if(!token){
    return res.status(401).json({message:"Not logged in"});
  }

  try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    req.user=decoded;
    next();
  }
  catch{
    return res.status(401).json({message:"Invalid token"});
  }
}



module.exports={authArtist,authUser}
