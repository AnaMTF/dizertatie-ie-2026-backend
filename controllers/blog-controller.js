import database from "../database/index.js";
import pgvector from "pgvector";
import { embed } from "../utils/embed.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function searchPosts(request, response) {
    const query = request.query.q?.trim();

    if (!query) {
        return sendError(response, 400, "Query parameter 'q' is required.");
    }

    try {
        const queryVector = await embed(query);
        const vectorLiteral = pgvector.toSql(queryVector);

        const [rows] = await database.query(
            `SELECT slug, 1 - (embedding <=> :vector) AS score
             FROM "PostEmbeddings"
             ORDER BY embedding <=> :vector
             LIMIT 20`,
            { replacements: { vector: vectorLiteral } },
        );

        return sendSuccess(response, 200, rows);
    } catch (error) {
        return sendError(response, 500, error.message);
    }
}
