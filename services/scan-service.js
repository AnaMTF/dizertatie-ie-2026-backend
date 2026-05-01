import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileTypeFromFile } from "file-type";

import database from "../database/index.js";
import { scanImageModel, scanModel } from "../models/index.js";
import { publishScanJob } from "./rabbitmq-service.js";
import { createError } from "../utils/error.js";

const scanInclude = [
    {
        model: scanImageModel,
        as: "images",
        attributes: ["uuid", "filePath", "mimeType"],
    },
];

function normalizeCompletedResults(results) {
    if (results && typeof results === "object" && !Array.isArray(results)) {
        return results;
    }

    if (results == null) {
        return {};
    }

    return {
        summary: results,
    };
}

function serializeScan(scan) {
    const serializedScan = scan.toJSON();

    if (serializedScan.status === "completed") {
        serializedScan.results = normalizeCompletedResults(
            serializedScan.results,
        );
    }

    return serializedScan;
}

async function resolveStoredMimeType(filePath) {
    const fileType = await fileTypeFromFile(filePath);
    return fileType?.mime || "application/octet-stream";
}

function buildScanJobPayload(scan) {
    const uploadsBasePath =
        process.env.UPLOADS_BASE_PATH || path.resolve(process.cwd(), "uploads");

    return {
        schemaVersion: "1.0",
        eventType: "scan.job.v1",
        jobId: randomUUID(),
        scanUuid: scan.uuid,
        patientUuid: scan.patientUuid,
        bodyPart: scan.bodyPart,
        imageType: scan.imageType,
        createdAt: new Date().toISOString(),
        storage: {
            kind: "local-shared-volume",
            uploadsBasePath,
        },
        images: (scan.images ?? []).map((image) => ({
            imageUuid: image.uuid,
            filePath: image.filePath,
            mimeType: image.mimeType,
        })),
    };
}

async function getOwnedScan(uuid, user) {
    const scan = await scanModel.findByPk(uuid, { include: scanInclude });

    if (!scan) {
        throw createError(404, "Scan not found");
    }

    if (scan.patientUuid !== user.uuid) {
        throw createError(403, "Patients can only access their own scans");
    }

    return scan;
}

export async function createScan(data, files, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can create scans");
    }

    const detectedMimeTypes = await Promise.all(
        (files ?? []).map((file) => resolveStoredMimeType(file.path)),
    );

    const scan = await database.transaction(async (transaction) => {
        const createdScan = await scanModel.create(
            {
                patientUuid: user.uuid,
                bodyPart: data.bodyPart,
                imageType: data.imageType,
            },
            { transaction },
        );

        await scanImageModel.bulkCreate(
            files.map((file, index) => ({
                scanUuid: createdScan.uuid,
                filePath: file.path,
                mimeType: detectedMimeTypes[index],
            })),
            { transaction },
        );

        return scanModel.findByPk(createdScan.uuid, {
            include: scanInclude,
            transaction,
        });
    });

    const jobPayload = buildScanJobPayload(scan);

    try {
        await publishScanJob(jobPayload);
    } catch (error) {
        const queueError =
            error instanceof Error ? error.message : "Failed to queue scan job";

        await scan.update({
            status: "failed",
            results: {
                error: "Failed to queue scan processing job",
                details: queueError,
            },
        });
    }

    return serializeScan(scan);
}

export async function getScans(user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can access scans");
    }

    const scans = await scanModel.findAll({
        where: { patientUuid: user.uuid },
        include: scanInclude,
        order: [["createdAt", "DESC"]],
    });

    return scans.map(serializeScan);
}

export async function getScanByUuid(uuid, user) {
    const scan = await getOwnedScan(uuid, user);
    return serializeScan(scan);
}
