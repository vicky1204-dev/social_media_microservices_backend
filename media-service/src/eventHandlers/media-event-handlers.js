import { Media } from "../models/Media.model";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.util";
import { logger } from "../utils/logger.util";

export const handlePostDeleted = async (event)=> {
    const {postId, mediaIds} = event;
    try {
        const mediaToDelete = Media.find({_id: {$in: mediaIds}})
        for(const media of mediaToDelete){
            await deleteMediaFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(`Deleted media ${media._id} associated with post ${postId}`)
        }
        logger.info(`Processed deletion of all media for the post ${postId}`)
    } catch (error) {
        logger.error(`ERROR occurred while media deletion: ${error}`)
    }
}