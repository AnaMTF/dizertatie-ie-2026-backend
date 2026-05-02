import webPush from "web-push";

import { createError } from "../utils/error.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:no-reply@example.com";

let isConfigured = false;

function ensureConfigured() {
    if (isConfigured) {
        return;
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        throw createError(
            500,
            "VAPID keys are not configured on the backend",
        );
    }

    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isConfigured = true;
}

export function getVapidPublicKey() {
    ensureConfigured();
    return VAPID_PUBLIC_KEY;
}

export async function sendWebPushNotification(subscription, payload) {
    ensureConfigured();

    return webPush.sendNotification(
        {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
            },
        },
        JSON.stringify(payload),
    );
}
