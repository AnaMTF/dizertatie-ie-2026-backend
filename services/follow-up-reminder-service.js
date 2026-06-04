import { Op, where, json } from "sequelize";

import {
    appointmentModel,
    doctorModel,
    followUpReminderModel,
    notificationModel,
} from "../models/index.js";
import { createNotification } from "./notification-service.js";

const FOLLOW_UP_INTERVAL_DAYS =
    Number(process.env.FOLLOW_UP_REMINDER_INTERVAL_DAYS) || 30;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value) {
    return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnlyText(date) {
    return date.toISOString().slice(0, 10);
}

function hasAtLeastDaysElapsed(appointmentDateText, days, now = new Date()) {
    const appointmentDate = parseDateOnly(appointmentDateText);
    const diffMs = now.getTime() - appointmentDate.getTime();
    return diffMs >= days * MS_IN_DAY;
}

function toSpecialtyLabel(specialty) {
    return specialty.charAt(0).toUpperCase() + specialty.slice(1);
}

async function hasPushNotificationForReminder(reminder) {
    const existingNotification = await notificationModel.findOne({
        where: {
            recipientRole: "patient",
            recipientUuid: reminder.patientUuid,
            type: "follow_up_reminder",
            [Op.and]: [
                where(json("data.lastAppointmentId"), reminder.appointmentUuid),
            ],
        },
        attributes: ["uuid"],
    });

    return Boolean(existingNotification);
}

export async function sendDueFollowUpReminders() {
    const now = new Date();
    const today = toDateOnlyText(now);

    const reminders = await followUpReminderModel.findAll({
        include: [
            {
                model: appointmentModel,
                as: "appointment",
                required: true,
                where: {
                    status: "completed",
                },
                attributes: ["uuid", "patientUuid", "date", "timeSlot"],
                include: [
                    {
                        model: doctorModel,
                        as: "doctor",
                        attributes: ["uuid", "specialization"],
                    },
                ],
            },
        ],
        order: [["sentAt", "ASC"]],
    });

    let sentCount = 0;

    for (const reminder of reminders) {
        const appointment = reminder.appointment;
        const specialty = appointment?.doctor?.specialization;

        if (!appointment || !specialty) {
            continue;
        }

        if (
            !hasAtLeastDaysElapsed(
                appointment.date,
                FOLLOW_UP_INTERVAL_DAYS,
                now,
            )
        ) {
            continue;
        }

        const hasFutureAppointment = await appointmentModel.findOne({
            where: {
                patientUuid: reminder.patientUuid,
                status: {
                    [Op.ne]: "cancelled",
                },
                date: {
                    [Op.gt]: today,
                },
            },
            include: [
                {
                    model: doctorModel,
                    as: "doctor",
                    attributes: ["uuid"],
                    where: {
                        specialization: specialty,
                    },
                },
            ],
            attributes: ["uuid"],
        });

        if (hasFutureAppointment) {
            continue;
        }

        if (await hasPushNotificationForReminder(reminder)) {
            continue;
        }

        const label = toSpecialtyLabel(specialty);

        await createNotification({
            userId: reminder.patientUuid,
            type: "follow_up_reminder",
            priority: "high",
            title: `${label} follow-up reminder`,
            body: `It's been over ${FOLLOW_UP_INTERVAL_DAYS} days since your last ${specialty} appointment. Consider scheduling a follow-up.`,
            data: {
                category: "follow_up_reminder",
                reminderKind: "follow_up",
                specialty,
                lastAppointmentId: reminder.appointmentUuid,
                targetDate: today,
                url: `/appointments?create=true&specialty=${encodeURIComponent(specialty)}`,
            },
            sendPush: true,
        });

        sentCount += 1;
    }

    return {
        evaluatedPatientSpecialties: reminders.length,
        sentCount,
    };
}
