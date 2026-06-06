import { Op, where, json } from "sequelize";

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

const DEFAULT_PUSH_ICON = process.env.PUSH_ICON || "light_logo.png";
const DEFAULT_PUSH_BADGE = process.env.PUSH_BADGE || "dark_logo.png";

function ensureRecipientUser(user) {
    if (!user || (user.role !== "patient" && user.role !== "doctor")) {
        throw createError(
            403,
            "Only patients and doctors can access notifications",
        );
    }
}

function getRecipientFilter(user) {
    ensureRecipientUser(user);

    return {
        recipientRole: user.role,
        recipientUuid: user.uuid,
    };
}

function getNotificationKindFilter(kind) {
    if (kind !== "reminder") {
        return {};
    }

    return {
        [Op.or]: [
            {
                type: "follow_up_reminder",
            },
            {
                type: "system_message",
                [Op.and]: [
                    where(json("data.category"), "appointment_reminder"),
                ],
            },
        ],
    };
}

function getLegacyRecipientFields(recipientRole, recipientUuid) {
    if (recipientRole === "patient") {
        return {
            patientUuid: recipientUuid,
            doctorUuid: null,
        };
    }

    return {
        patientUuid: null,
        doctorUuid: recipientUuid,
    };
}

function toNotificationPayload(notification) {
    return {
        title: notification.title,
        body: notification.body,
        icon: DEFAULT_PUSH_ICON,
        badge: DEFAULT_PUSH_BADGE,
        data: {
            notificationUuid: notification.uuid,
            priority: notification.priority ?? "medium",
            ...(notification.data ?? {}),
        },
    };
}

async function sendPushForNotification(notification) {
    const recipientRole = notification.recipientRole ?? "patient";
    const recipientUuid =
        notification.recipientUuid ?? notification.patientUuid;

    const subscriptions = await pushSubscriptionModel.findAll({
        where: {
            recipientRole,
            recipientUuid,
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
    recipientRole = "patient",
    type,
    title,
    body,
    priority = "medium",
    data = {},
    sendPush = false,
}) {
    const legacyFields = getLegacyRecipientFields(recipientRole, userId);

    const notification = await notificationModel.create({
        ...legacyFields,
        recipientRole,
        recipientUuid: userId,
        type,
        title,
        body,
        priority,
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
    const recipientFilter = getRecipientFilter(user);
    const kindFilter = getNotificationKindFilter(query.kind);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await notificationModel.findAndCountAll({
        where: {
            ...recipientFilter,
            ...kindFilter,
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
    const recipientFilter = getRecipientFilter(user);

    return notificationModel.count({
        where: {
            ...recipientFilter,
            readAt: {
                [Op.is]: null,
            },
        },
    });
}

export async function markNotificationAsRead(uuid, user) {
    const recipientFilter = getRecipientFilter(user);

    const notification = await notificationModel.findOne({
        where: {
            uuid,
            ...recipientFilter,
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
    const recipientFilter = getRecipientFilter(user);

    const [updatedRows] = await notificationModel.update(
        {
            readAt: new Date(),
        },
        {
            where: {
                ...recipientFilter,
                readAt: {
                    [Op.is]: null,
                },
            },
        },
    );

    return updatedRows;
}

export async function deleteNotification(uuid, user) {
    const recipientFilter = getRecipientFilter(user);

    const notification = await notificationModel.findOne({
        where: {
            uuid,
            ...recipientFilter,
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
