import * as scanService from "../services/scan-service.js";
import { supportedScanOptions } from "../config/supported-scan-options.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function createScan(request, response) {
    try {
        const scan = await scanService.createScan(
            request.body,
            request.files,
            request.user,
        );
        sendSuccess(response, 201, scan);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getScans(request, response) {
    try {
        const scans = await scanService.getScans(request.user);
        sendSuccess(response, 200, scans);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export function getScanOptions(_request, response) {
    sendSuccess(response, 200, supportedScanOptions);
}

export async function getScanByUuid(request, response) {
    try {
        const scan = await scanService.getScanByUuid(
            request.params.uuid,
            request.user,
        );
        const responseStatus = scan.status === "processing" ? 202 : 200;

        sendSuccess(response, responseStatus, scan);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getOptimizedScanImage(request, response) {
    try {
        const optimizedImage = await scanService.getOptimizedScanImage({
            scanUuid: request.params.scanUuid,
            imageUuid: request.params.imageUuid,
            user: request.user,
            query: request.query,
        });

        if (request.headers["if-none-match"] === optimizedImage.etag) {
            response.status(304).end();
            return;
        }

        response.set("Cache-Control", optimizedImage.cacheControl);
        response.set("Content-Type", optimizedImage.contentType);
        response.set("ETag", optimizedImage.etag);
        response.set("Last-Modified", optimizedImage.lastModified);
        response.sendFile(
            optimizedImage.filePath,
            { dotfiles: "allow" },
            (sendFileError) => {
                if (!sendFileError || response.headersSent) {
                    return;
                }

                sendError(
                    response,
                    sendFileError.status || 500,
                    sendFileError.message || "Unable to send optimized image",
                );
            },
        );
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
