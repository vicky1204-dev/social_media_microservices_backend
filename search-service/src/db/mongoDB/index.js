import mongoose from "mongoose";
import { logger } from "../../utils/logger.util.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        logger.error("MongoDB connection error", {error})
        throw new Error(error.message)
    }
}