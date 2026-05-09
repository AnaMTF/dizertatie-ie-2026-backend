import { pipeline } from "@huggingface/transformers";

let extractor = null;

async function getExtractor() {
    if (!extractor) {
        extractor = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2",
        );
    }
    return extractor;
}

/**
 * Returns a normalized 384-dimensional embedding for the given text.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embed(text) {
    const ext = await getExtractor();
    const output = await ext(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}
