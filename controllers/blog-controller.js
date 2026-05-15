import database from "../database/index.js";
import pgvector from "pgvector";
import { embed } from "../utils/embed.js";
import { sendError, sendSuccess } from "../utils/response.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function toPositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
}

export async function searchPosts(request, response) {
    const query = request.query.q?.trim();
    const page = toPositiveInt(request.query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInt(request.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    if (!query) {
        return sendError(response, 400, "Query parameter 'q' is required.");
    }

    try {
        const queryVector = await embed(query);
        const vectorLiteral = pgvector.toSql(queryVector);

        const [[{ totalItems = 0 } = {}]] = await database.query(
            `SELECT COUNT(*)::int AS "totalItems"
             FROM "PostEmbeddings"`,
        );

        const [rows] = await database.query(
            `SELECT slug, 1 - (embedding <=> :vector) AS score
             FROM "PostEmbeddings"
             ORDER BY embedding <=> :vector
             LIMIT :limit
             OFFSET :offset`,
            {
                replacements: {
                    vector: vectorLiteral,
                    limit,
                    offset,
                },
            },
        );

        return sendSuccess(response, 200, rows, {
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.max(1, Math.ceil(totalItems / limit)),
            },
        });
    } catch (error) {
        return sendError(response, 500, error.message);
    }
}
