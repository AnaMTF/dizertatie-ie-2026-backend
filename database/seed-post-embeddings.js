import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import database from "../database/index.js";
import "../models/index.js";
import { postEmbeddingModel } from "../models/post-embedding-model.js";
import { embed } from "../utils/embed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postsTxtDirectory =
    process.env.POSTS_TXT_DIR || path.resolve(__dirname, "../../posts-txt");

async function seedPostEmbeddings() {
    await database.authenticate();

    if ((process.env.DIALECT || "sqlite") === "postgres") {
        await database.query("CREATE EXTENSION IF NOT EXISTS vector");
    }

    await database.sync();

    const directoryEntries = await readdir(postsTxtDirectory, {
        withFileTypes: true,
    });

    const txtFiles = directoryEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    if (txtFiles.length === 0) {
        throw new Error(`No .txt files found in ${postsTxtDirectory}`);
    }

    console.log(
        `Seeding ${txtFiles.length} post embeddings from ${postsTxtDirectory}`,
    );

    let processed = 0;

    for (const fileName of txtFiles) {
        const slug = path.basename(fileName, ".txt");
        const fullPath = path.join(postsTxtDirectory, fileName);
        const content = (await readFile(fullPath, "utf8")).trim();

        if (!content) {
            console.warn(`Skipping ${fileName} because it is empty.`);
            continue;
        }

        const vector = await embed(content);

        await postEmbeddingModel.upsert({
            slug,
            embedding: vector,
        });

        processed += 1;
        console.log(`[${processed}/${txtFiles.length}] ${slug}`);
    }

    console.log(`Done. Upserted embeddings for ${processed} posts.`);
}

seedPostEmbeddings()
    .catch((error) => {
        console.error("Failed to seed post embeddings", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await database.close().catch(() => {});
    });
