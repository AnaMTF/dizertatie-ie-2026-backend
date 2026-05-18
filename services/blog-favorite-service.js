import { favoritePostModel, postEmbeddingModel } from "../models/index.js";
import { createError } from "../utils/error.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function ensureFavoriteAllowedRole(user) {
    if (!user || (user.role !== "patient" && user.role !== "doctor")) {
        throw createError(
            403,
            "Only patients and doctors can manage favorites",
        );
    }
}

function toPositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
}

function toPublicFavorite(item) {
    return {
        uuid: item.uuid,
        recipientRole: item.recipientRole,
        recipientUuid: item.recipientUuid,
        postSlug: item.postSlug,
        createdAt: item.createdAt,
    };
}

async function ensurePostExists(postSlug) {
    const post = await postEmbeddingModel.findByPk(postSlug, {
        attributes: ["slug"],
    });

    if (!post) {
        throw createError(404, "Blog post not found");
    }
}

export async function listFavoritePosts(user, query = {}) {
    ensureFavoriteAllowedRole(user);

    const page = toPositiveInt(query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const where = {
        recipientRole: user.role,
        recipientUuid: user.uuid,
    };

    const slugFilter = typeof query.slug === "string" ? query.slug.trim() : "";

    if (slugFilter) {
        where.postSlug = slugFilter;
    }

    const { rows, count } = await favoritePostModel.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    return {
        data: rows.map(toPublicFavorite),
        pagination: {
            page,
            limit,
            totalItems: count,
            totalPages: Math.max(1, Math.ceil(count / limit)),
        },
    };
}

export async function createFavoritePost(postSlug, user) {
    ensureFavoriteAllowedRole(user);

    await ensurePostExists(postSlug);

    const [favorite] = await favoritePostModel.findOrCreate({
        where: {
            recipientRole: user.role,
            recipientUuid: user.uuid,
            postSlug,
        },
        defaults: {
            recipientRole: user.role,
            recipientUuid: user.uuid,
            postSlug,
        },
    });

    return toPublicFavorite(favorite);
}

export async function deleteFavoritePost(postSlug, user) {
    ensureFavoriteAllowedRole(user);

    const deletedRows = await favoritePostModel.destroy({
        where: {
            recipientRole: user.role,
            recipientUuid: user.uuid,
            postSlug,
        },
    });

    return deletedRows > 0;
}

export async function listFavoritePostSlugs(user) {
    ensureFavoriteAllowedRole(user);

    const items = await favoritePostModel.findAll({
        where: {
            recipientRole: user.role,
            recipientUuid: user.uuid,
        },
        attributes: ["postSlug"],
    });

    return items.map((item) => item.postSlug);
}
