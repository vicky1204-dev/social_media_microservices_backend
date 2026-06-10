import { Router } from "express";
import { searchPostController } from "../controllers/search.controller";
import { authenticateRequest } from "../middlewares/auth.middleware";

export const router = Router()

router.get("/posts", authenticateRequest, searchPostController)