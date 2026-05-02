import cron from "node-cron";

import { sendDueOncologyFollowUpReminders } from "./follow-up-reminder-service.js";

let followUpReminderTask;

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
                const summary = await sendDueOncologyFollowUpReminders();
                console.log("Follow-up reminder scheduler completed", summary);
            } catch (error) {
                console.error("Follow-up reminder scheduler failed", error);
            }
        },
        cronOptions,
    );
}

export async function runFollowUpReminderCheckNow() {
    return sendDueOncologyFollowUpReminders();
}
