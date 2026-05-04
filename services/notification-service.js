import { Op } from "sequelize";

import { notificationModel, pushSubscriptionModel } from "../models/index.js";
import { createError } from "../utils/error.js";
import { sendWebPushNotification } from "./web-push-service.js";

const DEFAULT_PUSH_ICON =
    process.env.PUSH_ICON || "/images/logo/logo-light.webp";
const DEFAULT_PUSH_BADGE =
    process.env.PUSH_BADGE || "/images/logo/logo-light.webp";

function ensurePatientUser(user) {
    if (!user || user.role !== "patient") {
        throw createError(403, "Only patients can access notifications");
    }
}

function toNotificationPayload(notification) {
    return {
        title: notification.title,
        body: notification.body,
        icon: DEFAULT_PUSH_ICON,
        badge: DEFAULT_PUSH_BADGE,
        data: {
            notificationUuid: notification.uuid,
            ...(notification.data ?? {}),
        },
    };
}

async function sendPushForNotification(notification) {
    const subscriptions = await pushSubscriptionModel.findAll({
        where: {
            patientUuid: notification.patientUuid,
        },
    });

    if (!subscriptions.length) {
        return;
    }

    const pushPayload = toNotificationPayload(notification);

    await Promise.all(
        subscriptions.map(async (subscription) => {
            try {
                await sendWebPushNotification(subscription, pushPayload);
            } catch (error) {
                if (error?.statusCode === 404 || error?.statusCode === 410) {
                    await subscription.destroy();
                    return;
                }

                console.error(
                    "Push notification delivery failed",
                    subscription.endpoint,
                    error,
                );
            }
        }),
    );
}

export async function createNotification({
    userId,
    type,
    title,
    body,
    data = {},
    sendPush = false,
}) {
    const notification = await notificationModel.create({
        patientUuid: userId,
        type,
        title,
        body,
        data,
    });

    if (!sendPush) {
        return notification;
    }

    try {
        await sendPushForNotification(notification);
    } catch (error) {
        console.error(
            "Push pipeline failed after notification persistence",
            error,
        );
    }

    return notification;
}

export async function getNotifications(user, query = {}) {
    ensurePatientUser(user);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await notificationModel.findAndCountAll({
        where: {
            patientUuid: user.uuid,
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    return {
        items: rows,
        pagination: {
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
        },
    };
}

export async function getUnreadNotificationCount(user) {
    ensurePatientUser(user);

    return notificationModel.count({
        where: {
            patientUuid: user.uuid,
            readAt: {
                [Op.is]: null,
            },
        },
    });
}

export async function markNotificationAsRead(uuid, user) {
    ensurePatientUser(user);

    const notification = await notificationModel.findOne({
        where: {
            uuid,
            patientUuid: user.uuid,
        },
    });

    if (!notification) {
        return null;
    }

    if (!notification.readAt) {
        notification.readAt = new Date();
        await notification.save();
    }

    return notification;
}

export async function markAllNotificationsAsRead(user) {
    ensurePatientUser(user);

    const [updatedRows] = await notificationModel.update(
        {
            readAt: new Date(),
        },
        {
            where: {
                patientUuid: user.uuid,
                readAt: {
                    [Op.is]: null,
                },
            },
        },
    );

    return updatedRows;
}

export async function deleteNotification(uuid, user) {
    ensurePatientUser(user);

    const notification = await notificationModel.findOne({
        where: {
            uuid,
            patientUuid: user.uuid,
        },
    });

    if (!notification) {
        return false;
    }

    await notification.destroy();
    return true;
}
