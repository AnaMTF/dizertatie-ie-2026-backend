import { pushSubscriptionModel } from "../models/index.js";
import { createError } from "../utils/error.js";

function ensurePatientUser(user) {
    if (!user || user.role !== "patient") {
        throw createError(403, "Only patients can manage push subscriptions");
    }
}

export async function createOrUpdatePushSubscription(data, user, userAgent) {
    ensurePatientUser(user);

    const existingSubscription = await pushSubscriptionModel.findOne({
        where: {
            endpoint: data.endpoint,
        },
    });

    if (existingSubscription) {
        await existingSubscription.update({
            patientUuid: user.uuid,
            p256dh: data.keys.p256dh,
            auth: data.keys.auth,
            userAgent: userAgent || null,
        });

        return existingSubscription;
    }

    return pushSubscriptionModel.create({
        patientUuid: user.uuid,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: userAgent || null,
    });
}

export async function deletePushSubscription(endpoint, user) {
    ensurePatientUser(user);

    const deletedRows = await pushSubscriptionModel.destroy({
        where: {
            patientUuid: user.uuid,
            endpoint,
        },
    });

    return deletedRows > 0;
}

export async function getPushSubscriptionsByPatientUuid(patientUuid) {
    return pushSubscriptionModel.findAll({
        where: {
            patientUuid,
        },
    });
}
