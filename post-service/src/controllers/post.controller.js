import { redisClient } from "../db/redis/client.js";
import { Post } from "../models/Post.model.js";
import { logger } from "../utils/logger.util.js";
import { publishEvent } from "../utils/rabbitmq.js";
import { validateCreatePost } from "../utils/validator.util.js";

async function invalidatePostCache(input) {
  const cachedPostKey = `post:${input}`
  await redisClient.del(cachedPostKey)

  const keys = await redisClient.keys("posts:*");
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Create Post endpoint hit");
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const newPost = await Post.create({
      user: req.user,
      content,
      mediaIds: mediaIds || [],
    });

    await publishEvent("post.created", {
      postId: newPost._id.toString(),
      userId: newPost.user.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    })

    await invalidatePostCache(newPost._id.toString());
    logger.info("Post created successfully");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    logger.error("Error creating post", { error });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllPosts = async (req, res) => {
  logger.info("Get all posts endpoint hit");
  try {
    const page = parseInt(req.query?.page) || 1; //-----------PAGINATION------------------
    const limit = parseInt(req.query?.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await redisClient.get(cacheKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: totalPosts / limit,
      totalPosts,
    };

    await redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    logger.error("Error fetching posts", { error });
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

const getPost = async (req, res) => {
  logger.info("Get post endpoint hit")
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await redisClient.get(cacheKey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const postDetails = await Post.findById(postId);
    if (!postDetails) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await redisClient.setex(cacheKey, 3600, JSON.stringify(postDetails));
    res.status(200).json(postDetails);
  } catch (error) {
    logger.error("Error fetching post", { error });
    res.status(500).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user
    })

    if(!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    //publishing the delete event
    //the routing key "post.deleted" is nothing but a unique identifier like the event name
    await publishEvent("post.deleted", {
      postId: post._id,
      mediaIds: post.mediaIds,
      userId: req.user.userId
    }) 
    await invalidatePostCache(req.params.id)
    res.json({
      success: true,
      message: "Post deleted successfully"
    })
  } catch (error) {
    logger.error("Error deleting post", { error });
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

export { createPost, getAllPosts, getPost, deletePost };
