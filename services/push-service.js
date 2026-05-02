import { getVapidPublicKey } from "./web-push-service.js";
import {
    createOrUpdatePushSubscription,
    deletePushSubscription,
} from "./push-subscription-service.js";

export async function getPushPublicKey() {
    return getVapidPublicKey();
}

export async function createSubscription(data, user, userAgent) {
    return createOrUpdatePushSubscription(data, user, userAgent);
}

export async function removeSubscription(endpoint, user) {
    return deletePushSubscription(endpoint, user);
}
