import * as blogFavoriteService from "../services/blog-favorite-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function getFavoritePosts(request, response) {
    try {
        const result = await blogFavoriteService.listFavoritePosts(
            request.user,
            request.query,
        );

        sendSuccess(response, 200, result.data, {
            pagination: result.pagination,
        });
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function addFavoritePost(request, response) {
    try {
        const favorite = await blogFavoriteService.createFavoritePost(
            request.body.slug,
            request.user,
        );

        sendSuccess(response, 201, favorite);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function removeFavoritePost(request, response) {
    try {
        const deleted = await blogFavoriteService.deleteFavoritePost(
            request.body.slug,
            request.user,
        );

        if (!deleted) {
            return sendError(response, 404, "Favorite blog post not found");
        }

        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
