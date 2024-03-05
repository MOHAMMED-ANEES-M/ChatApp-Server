const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

const verifyToken=(req,res,next)=>{
    const token= req.headers['authorization'];
    // console.log(token,'token');

    if(!token){
        return res.status(403).json({ message: 'Token is not provided'})
    }

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).json({message: 'Unauthorized: Invalid token'})
        }
        req.user= decoded.user
        console.log(req.decoded);
        next();
    });
  };

module.exports = verifyToken;
