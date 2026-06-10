import { Search } from "../models/Search.model.js"
import {logger} from "../utils/logger.util.js"

export async function handlePostCreated ({postId, userId, content, createdAt}){  
    try {
        const newSearchPost = await Search.create({
            postId,
            userId,
            content,
            createdAt
        })

        logger.info(`Search post created: ${postId}, ${newSearchPost._id.toString()}`)
    } catch (error) {
        logger.error(`Error handling post creation event: ${error}`)
    }
}

export const handlePostDeleted = async({postId, userId})=>{
try {
    await Search.findOneAndDelete({postId});
    logger.info(`Search Post deleted: ${postId}`)
} catch (error) {
    logger.error(`Error handling post deletion event: ${error}`)
}
}