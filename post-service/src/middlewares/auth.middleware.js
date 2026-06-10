import { logger } from "../utils/logger.util.js";

export const authenticateRequest = (req, res, next)=>{
    const userId = req.headers["x-user-id"] //we'll get this from the api gateway

    if(!userId) {
        logger.warn("Access attempted without user ID")
        return res.status(401).json({
            success: false,
            message: "Authentication required! Please login to continue"
        })
    }

    req.user = userId
    next()
}

