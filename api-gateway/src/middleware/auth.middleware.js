import {logger} from "../utils/logger.util.js"
import jwt from "jsonwebtoken"

export const validateToken = (req, res, next)=>{
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if(!token) {
        logger.warn("Access attempt without valid token! ")
        return res.status(401).json({
            success: false,
            message: "Authentication Required"
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
        if(err){
            logger.warn("Invalid token! ")
        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        })
        }
        req.user = user
        next()
    })
}