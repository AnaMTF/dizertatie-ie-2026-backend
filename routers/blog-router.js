import { Router } from "express";
import { authenticate, authorizeRoles, validate } from "../middleware/index.js";
import { searchPosts } from "../controllers/blog-controller.js";
import {
    addFavoritePost,
    getFavoritePosts,
    removeFavoritePost,
} from "../controllers/blog-favorite-controller.js";
import { validateBlogFavorite } from "../validators/blog-favorite-validator.js";

const router = Router();

router.get("/blog/search", searchPosts);
router.get(
    "/blog/favorites",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getFavoritePosts,
);
router.post(
    "/blog/favorites",
    authenticate,
    authorizeRoles("patient", "doctor"),
    validate(validateBlogFavorite),
    addFavoritePost,
);
router.delete(
    "/blog/favorites",
    authenticate,
    authorizeRoles("patient", "doctor"),
    validate(validateBlogFavorite),
    removeFavoritePost,
);

export default router;
