import { Op } from "sequelize";

import {
    notificationModel,
    pushDeliveryLogModel,
    pushDeliveryQueueModel,
    pushSubscriptionModel,
} from "../models/index.js";
import { createError } from "../utils/error.js";
import { sendWebPushNotification } from "./web-push-service.js";

const PUSH_RETRY_MAX_ATTEMPTS =
    Number(process.env.PUSH_RETRY_MAX_ATTEMPTS) || 4;
const PUSH_RETRY_BATCH_SIZE = 100;

function computeNextRetryAt(attemptCount) {
    const backoffMs = Math.pow(2, attemptCount) * 5 * 60 * 1000;
    return new Date(Date.now() + backoffMs);
}

async function enqueuePushRetry(notificationUuid, subscriptionUuid, payload) {
    await pushDeliveryQueueModel.create({
        notificationUuid,
        subscriptionUuid,
        payload,
        nextRetryAt: computeNextRetryAt(0),
    });
}

async function logPushAttempt({
    notificationUuid,
    subscriptionEndpoint,
    attemptNumber,
    statusCode = null,
    errorMessage = null,
    succeeded,
}) {
    await pushDeliveryLogModel.create({
        notificationUuid,
        subscriptionEndpoint,
        attemptNumber,
        statusCode,
        errorMessage,
        succeeded,
    });
}

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
                    await logPushAttempt({
                        notificationUuid: notification.uuid,
                        subscriptionEndpoint: subscription.endpoint,
                        attemptNumber: 1,
                        statusCode: error.statusCode,
                        succeeded: false,
                    });
                    return;
                }

                await logPushAttempt({
                    notificationUuid: notification.uuid,
                    subscriptionEndpoint: subscription.endpoint,
                    attemptNumber: 1,
                    errorMessage: error?.message ?? "Unknown error",
                    succeeded: false,
                });
                await enqueuePushRetry(
                    notification.uuid,
                    subscription.uuid,
                    pushPayload,
                );
                console.error(
                    "Push delivery failed; queued for retry",
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

export async function processPushDeliveryRetries() {
    const now = new Date();

    const pending = await pushDeliveryQueueModel.findAll({
        where: {
            status: "pending",
            nextRetryAt: {
                [Op.lte]: now,
            },
        },
        include: [
            {
                model: pushSubscriptionModel,
                as: "subscription",
                required: false,
            },
        ],
        order: [["nextRetryAt", "ASC"]],
        limit: PUSH_RETRY_BATCH_SIZE,
    });

    let processedCount = 0;
    let succeededCount = 0;
    let failedCount = 0;
    let terminalCount = 0;

    for (const entry of pending) {
        processedCount += 1;

        if (!entry.subscription) {
            await entry.update({ status: "terminal" });
            terminalCount += 1;
            continue;
        }

        const attemptNumber = entry.attemptCount + 2;

        try {
            await sendWebPushNotification(entry.subscription, entry.payload);
            await logPushAttempt({
                notificationUuid: entry.notificationUuid,
                subscriptionEndpoint: entry.subscription.endpoint,
                attemptNumber,
                succeeded: true,
            });
            await entry.destroy();
            succeededCount += 1;
        } catch (error) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
                await entry.subscription.destroy();
                await logPushAttempt({
                    notificationUuid: entry.notificationUuid,
                    subscriptionEndpoint: entry.subscription.endpoint,
                    attemptNumber,
                    statusCode: error.statusCode,
                    succeeded: false,
                });
                await entry.update({
                    status: "terminal",
                    attemptCount: entry.attemptCount + 1,
                });
                terminalCount += 1;
                continue;
            }

            const newAttemptCount = entry.attemptCount + 1;

            await logPushAttempt({
                notificationUuid: entry.notificationUuid,
                subscriptionEndpoint: entry.subscription.endpoint,
                attemptNumber,
                errorMessage: error?.message ?? "Unknown error",
                succeeded: false,
            });

            if (newAttemptCount >= PUSH_RETRY_MAX_ATTEMPTS) {
                await entry.update({
                    status: "terminal",
                    attemptCount: newAttemptCount,
                });
                terminalCount += 1;
            } else {
                await entry.update({
                    attemptCount: newAttemptCount,
                    lastAttemptAt: now,
                    nextRetryAt: computeNextRetryAt(newAttemptCount),
                });
                failedCount += 1;
            }
        }
    }

    return { processedCount, succeededCount, failedCount, terminalCount };
}
