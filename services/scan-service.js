import { unlink } from "node:fs/promises";
import { fileTypeFromFile } from "file-type";

import database from "../database/index.js";
import { scanImageModel, scanModel } from "../models/index.js";

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

const scanInclude = [
    {
        model: scanImageModel,
        as: "images",
        attributes: ["uuid", "filePath", "mimeType", "bodyPart", "imageType"],
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

async function cleanupUploadedFiles(files) {
    await Promise.allSettled((files ?? []).map((file) => unlink(file.path)));
}

async function resolveStoredMimeType(filePath) {
    const fileType = await fileTypeFromFile(filePath);
    return fileType?.mime || "application/octet-stream";
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

    try {
        const detectedMimeTypes = await Promise.all(
            (files ?? []).map((file) => resolveStoredMimeType(file.path)),
        );

        const scan = await database.transaction(async (transaction) => {
            const createdScan = await scanModel.create(
                {
                    patientUuid: user.uuid,
                },
                { transaction },
            );

            await scanImageModel.bulkCreate(
                data.map((image, index) => ({
                    scanUuid: createdScan.uuid,
                    filePath: files[index].path,
                    mimeType: detectedMimeTypes[index],
                    bodyPart: image.bodyPart,
                    imageType: image.imageType,
                })),
                { transaction },
            );

            return scanModel.findByPk(createdScan.uuid, {
                include: scanInclude,
                transaction,
            });
        });

        return serializeScan(scan);
    } catch (error) {
        await cleanupUploadedFiles(files);
        throw error;
    }
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
