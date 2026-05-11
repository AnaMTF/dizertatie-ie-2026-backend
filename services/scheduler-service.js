import cron from "node-cron";

import { sendDueFollowUpReminders } from "./follow-up-reminder-service.js";
import { processPushDeliveryRetries } from "./notification-service.js";

let followUpReminderTask;
let pushRetryTask; // eslint-disable-line no-unused-vars

export function startSchedulers() {
    if (followUpReminderTask) {
        return;
    }

    const cronOptions = {};

    if (process.env.SCHEDULER_TIMEZONE) {
        cronOptions.timezone = process.env.SCHEDULER_TIMEZONE;
    }

    followUpReminderTask = cron.schedule(
        "0 9 * * *",
        async () => {
            try {
                const summary = await sendDueFollowUpReminders();
                console.log("Follow-up reminder scheduler completed", summary);
            } catch (error) {
                console.error("Follow-up reminder scheduler failed", error);
            }
        },
        cronOptions,
    );

    pushRetryTask = cron.schedule(
        "*/5 * * * *",
        async () => {
            try {
                const summary = await processPushDeliveryRetries();
                if (summary.processedCount > 0) {
                    console.log("Push retry runner completed", summary);
                }
            } catch (error) {
                console.error("Push retry runner failed", error);
            }
        },
        cronOptions,
    );
}

export async function runFollowUpReminderCheckNow() {
    return sendDueFollowUpReminders();
}

export async function runPushRetryNow() {
    return processPushDeliveryRetries();
}
