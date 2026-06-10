import { logger } from "../utils/logger.util.js";
import { uploadToCloudinary } from "../utils/cloudinary.util.js";
import { Media } from "../models/Media.model.js";

const uploadMedia = async (req, res) => {
  logger.info("Media upload endpoint hit");
  try {
    if (!req.file) {
      logger.error("No file found, please add a file to upload.");
      return res.status(400).json({
        success: false,
        message: "No file found, please add a file to upload.",
      });
    }
    const { originalname, mimetype } = req.file; // because we recieve these in lowecase letters from req.files so cant use camel case
    const userId = req.user;

    logger.info(`File details: Name: ${originalname}, Type: ${mimetype}`);
    logger.info("Starting file upload to cloudinary...");

    const cloudinaryUploadResult = await uploadToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfull, Public id: ${cloudinaryUploadResult.public_id}`
    );

    const newMedia = await Media.create({
      publicId: cloudinaryUploadResult.public_id,
      mimeType: mimetype,
      originalName: originalname,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    res.status(201).json({
      success: true,
      mediaId: newMedia._id,
      url: newMedia.url,
      message: "Media upload is successfull",
    });
  } catch (error) {
    logger.error("Error in media uploading", { error });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
    uploadMedia
}