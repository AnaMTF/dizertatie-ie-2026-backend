import * as pushService from "../services/push-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function getPushPublicKey(request, response) {
    try {
        const publicKey = await pushService.getPushPublicKey();
        sendSuccess(response, 200, {
            publicKey,
        });
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function createPushSubscription(request, response) {
    try {
        const subscription = await pushService.createSubscription(
            request.body,
            request.user,
            request.headers["user-agent"],
        );

        sendSuccess(response, 201, subscription);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deletePushSubscription(request, response) {
    try {
        const deleted = await pushService.removeSubscription(
            request.body.endpoint,
            request.user,
        );

        if (!deleted) {
            return sendError(response, 404, "Push subscription not found");
        }

        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
