import { scanModel } from "../models/index.js";

function normalizeFailedPayload(payload) {
    if (payload?.results && typeof payload.results === "object") {
        return payload.results;
    }

    return {
        error: payload?.error || "Scan processing failed",
    };
}

export async function applyScanResult(payload) {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid result payload");
    }

    if (!payload.scanUuid || typeof payload.scanUuid !== "string") {
        throw new Error("Missing scanUuid in result payload");
    }

    const scan = await scanModel.findByPk(payload.scanUuid);

    if (!scan) {
        throw new Error("Scan from result payload was not found");
    }

    if (scan.status !== "processing") {
        return;
    }

    if (payload.status === "completed") {
        const resultData =
            payload?.results && typeof payload.results === "object"
                ? payload.results
                : {};

        await scan.update({
            status: "completed",
            results: {
                ...resultData,
                jobId: payload.jobId,
                processedAt: payload.processedAt,
            },
        });

        return;
    }

    await scan.update({
        status: "failed",
        results: {
            ...normalizeFailedPayload(payload),
            jobId: payload.jobId,
            processedAt: payload.processedAt,
        },
    });
}
