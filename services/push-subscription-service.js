import { pushSubscriptionModel } from "../models/index.js";
import { createError } from "../utils/error.js";

function ensureRecipientUser(user) {
    if (!user || (user.role !== "patient" && user.role !== "doctor")) {
        throw createError(
            403,
            "Only patients and doctors can manage push subscriptions",
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

function getRecipientLegacyFields(user) {
    if (user.role === "patient") {
        return {
            patientUuid: user.uuid,
            doctorUuid: null,
        };
    }

    return {
        patientUuid: null,
        doctorUuid: user.uuid,
    };
}

export async function createOrUpdatePushSubscription(data, user, userAgent) {
    const recipientFilter = getRecipientFilter(user);
    const recipientLegacyFields = getRecipientLegacyFields(user);

    const existingSubscription = await pushSubscriptionModel.findOne({
        where: {
            endpoint: data.endpoint,
        },
    });

    if (existingSubscription) {
        await existingSubscription.update({
            ...recipientFilter,
            ...recipientLegacyFields,
            p256dh: data.keys.p256dh,
            auth: data.keys.auth,
            userAgent: userAgent || null,
        });

        return existingSubscription;
    }

    return pushSubscriptionModel.create({
        ...recipientFilter,
        ...recipientLegacyFields,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: userAgent || null,
    });
}

export async function deletePushSubscription(endpoint, user) {
    const recipientFilter = getRecipientFilter(user);

    const deletedRows = await pushSubscriptionModel.destroy({
        where: {
            ...recipientFilter,
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

export async function getPushSubscriptionsByRecipient(
    recipientRole,
    recipientUuid,
) {
    return pushSubscriptionModel.findAll({
        where: {
            recipientRole,
            recipientUuid,
        },
    });
}
