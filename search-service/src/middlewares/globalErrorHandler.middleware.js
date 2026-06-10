import {logger} from "../utils/logger.util.js"

export const errorHandler = (err, req, res, next) => {
    logger.error(err.stack)

     res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    })
}

//we dont need next() here bcs this is a error handling middleware as it has 4 arguments, and express treats these error handling middleware differently than normal middlewares, if you want to pass the error to another error handling middleware then u can next(err)