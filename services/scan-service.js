import path from "node:path";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";

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

const CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24;

function parseBoundedInteger(value, fallback, { min, max }) {
    if (value == null || value === "") {
        return fallback;
    }

    const parsedValue = Number.parseInt(String(value), 10);

    if (!Number.isFinite(parsedValue)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, parsedValue));
}

function resolveImageFormat(requestedFormat) {
    const normalizedFormat = String(requestedFormat || "")
        .trim()
        .toLowerCase();

    if (normalizedFormat === "jpg") {
        return "jpeg";
    }

    if (["jpeg", "png", "webp"].includes(normalizedFormat)) {
        return normalizedFormat;
    }

    return "webp";
}

function getContentTypeForFormat(format) {
    if (format === "jpeg") {
        return "image/jpeg";
    }

    if (format === "png") {
        return "image/png";
    }

    return "image/webp";
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

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

async function getOwnedScanImage(scanUuid, imageUuid, user) {
    const scan = await scanModel.findByPk(scanUuid, {
        include: [
            {
                model: scanImageModel,
                as: "images",
                where: { uuid: imageUuid },
                attributes: ["uuid", "filePath", "mimeType"],
                required: false,
            },
        ],
    });

    if (!scan) {
        throw createError(404, "Scan not found");
    }

    if (scan.patientUuid !== user.uuid) {
        throw createError(403, "Patients can only access their own scans");
    }

    const image = scan.images?.[0];

    if (!image) {
        throw createError(404, "Scan image not found");
    }

    return image;
}

async function ensureOptimizedImageCached({
    sourcePath,
    cachePath,
    format,
    width,
    height,
    quality,
}) {
    if (await fileExists(cachePath)) {
        return;
    }

    const temporaryCachePath = `${cachePath}.${randomUUID()}.tmp`;

    try {
        let pipeline = sharp(sourcePath).rotate();

        if (width || height) {
            pipeline = pipeline.resize({
                width: width || null,
                height: height || null,
                fit: "inside",
                withoutEnlargement: true,
            });
        }

        if (format === "jpeg") {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        } else if (format === "png") {
            pipeline = pipeline.png({ compressionLevel: 9 });
        } else {
            pipeline = pipeline.webp({ quality });
        }

        await pipeline.toFile(temporaryCachePath);

        await fs.rename(temporaryCachePath, cachePath).catch(async (error) => {
            if (error?.code !== "EEXIST") {
                throw error;
            }

            await fs.unlink(temporaryCachePath).catch(() => {});
        });
    } catch (error) {
        await fs.unlink(temporaryCachePath).catch(() => {});
        throw error;
    }
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

export async function getOptimizedScanImage({
    scanUuid,
    imageUuid,
    user,
    query,
}) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can access scan images");
    }

    const image = await getOwnedScanImage(scanUuid, imageUuid, user);
    const uploadsBasePath = path.resolve(
        process.env.UPLOADS_BASE_PATH || path.resolve(process.cwd(), "uploads"),
    );
    const resolvedSourcePath = path.resolve(process.cwd(), image.filePath);
    const sourcePathRelativeToUploads = path.relative(
        uploadsBasePath,
        resolvedSourcePath,
    );

    if (
        sourcePathRelativeToUploads.startsWith("..") ||
        path.isAbsolute(sourcePathRelativeToUploads)
    ) {
        throw createError(400, "Invalid scan image path");
    }

    const sourceStats = await fs.stat(resolvedSourcePath).catch(() => null);

    if (!sourceStats) {
        throw createError(404, "Scan image file not found");
    }

    const width = parseBoundedInteger(query?.w, 1024, { min: 320, max: 2400 });
    const height = parseBoundedInteger(query?.h, 1024, { min: 320, max: 2400 });
    const quality = parseBoundedInteger(query?.q, 78, { min: 35, max: 95 });
    const format = resolveImageFormat(query?.format);
    const cacheDirectory = path.resolve(
        uploadsBasePath,
        "cache",
        "scan-images",
    );

    await fs.mkdir(cacheDirectory, { recursive: true });

    const cacheKeyPayload = JSON.stringify({
        imageUuid,
        sourcePath: resolvedSourcePath,
        sourceSize: sourceStats.size,
        sourceMtimeMs: Math.trunc(sourceStats.mtimeMs),
        width,
        height,
        quality,
        format,
    });
    const cacheKey = createHash("sha256").update(cacheKeyPayload).digest("hex");
    const cachePath = path.join(cacheDirectory, `${cacheKey}.${format}`);

    await ensureOptimizedImageCached({
        sourcePath: resolvedSourcePath,
        cachePath,
        format,
        width,
        height,
        quality,
    });

    return {
        filePath: cachePath,
        contentType: getContentTypeForFormat(format),
        etag: `"${cacheKey}"`,
        lastModified: sourceStats.mtime.toUTCString(),
        cacheControl: `private, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
    };
}
