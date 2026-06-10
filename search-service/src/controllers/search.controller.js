import { logger } from "../utils/logger.util";
import { Search } from "../models/Search.model.js";

export const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit");
  try {
    const { query } = req.query;
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    res.json(results);
  } catch (error) {
    logger.error("Error searching post", { error });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
