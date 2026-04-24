import * as scanService from "../services/scan-service.js";
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
