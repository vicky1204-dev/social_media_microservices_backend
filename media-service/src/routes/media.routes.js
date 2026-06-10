import {Router} from "express"
import {uploadMedia} from "../controllers/media.controller.js"
import { authenticateRequest } from "../middlewares/auth.middleware.js"
import { logger } from "../utils/logger.util.js"
import { upload } from "../middlewares/multer.middleware.js"
import multer from "multer"

export const mediaRouter = Router()

mediaRouter.route("/upload").post(authenticateRequest, (req, res, next)=>{
    upload(req, res, function(err){
        if(err instanceof multer.MulterError){
            logger.error("Multer error while uploading", {err})
            return res.status(500).json({
                success: false,
                message: "Multer error while uploading",
                error: err.message,
                stack: err.stack
            })
        } else if(err) {
             logger.error("Unknown error while uploading", {err})
            return res.status(500).json({
                success: false,
                message: "Unknown error while uploading",
                error: err.message,
                stack: err.stack
            })
        }
    })
    next()
}, uploadMedia)