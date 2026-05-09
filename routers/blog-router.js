import { Router } from "express";
import { searchPosts } from "../controllers/blog-controller.js";

const router = Router();

router.get("/blog/search", searchPosts);

export default router;
