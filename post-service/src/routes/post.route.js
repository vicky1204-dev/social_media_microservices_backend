import {Router} from "express"
import { createPost, deletePost, getAllPosts, getPost } from "../controllers/post.controller.js";
import { authenticateRequest } from "../middlewares/auth.middleware.js";

export const router = Router()

router.route("/create-post").post(authenticateRequest, createPost)
router.route("/all-posts").get(authenticateRequest, getAllPosts)
router.route("/:id").get(authenticateRequest, getPost)
router.route("/:id").delete(authenticateRequest, deletePost)