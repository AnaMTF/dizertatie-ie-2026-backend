import * as notificationService from "../services/notification-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function getNotifications(request, response) {
    try {
        const result = await notificationService.getNotifications(
            request.user,
            request.query,
        );

        sendSuccess(response, 200, result.items, {
            pagination: result.pagination,
        });
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getUnreadNotificationCount(request, response) {
    try {
        const count = await notificationService.getUnreadNotificationCount(
            request.user,
        );

        sendSuccess(response, 200, {
            count,
        });
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function markNotificationAsRead(request, response) {
    try {
        const notification = await notificationService.markNotificationAsRead(
            request.params.uuid,
            request.user,
        );

        if (!notification) {
            return sendError(response, 404, "Notification not found");
        }

        sendSuccess(response, 200, notification);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function markAllNotificationsAsRead(request, response) {
    try {
        const updatedCount = await notificationService.markAllNotificationsAsRead(
            request.user,
        );

        sendSuccess(response, 200, {
            updatedCount,
        });
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deleteNotification(request, response) {
    try {
        const deleted = await notificationService.deleteNotification(
            request.params.uuid,
            request.user,
        );

        if (!deleted) {
            return sendError(response, 404, "Notification not found");
        }

        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
