import { Op } from "sequelize";

import {
    appointmentModel,
    doctorModel,
    followUpReminderModel,
} from "../models/index.js";
import { createNotification } from "./notification-service.js";

const REMINDER_TYPE = "oncology_follow_up";
const REMINDER_SPECIALTY = "oncology";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value) {
    return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnlyText(date) {
    return date.toISOString().slice(0, 10);
}

function hasAtLeastThirtyDaysElapsed(appointmentDateText, now = new Date()) {
    const appointmentDate = parseDateOnly(appointmentDateText);
    const diffMs = now.getTime() - appointmentDate.getTime();
    return diffMs >= 30 * MS_IN_DAY;
}

export async function sendDueOncologyFollowUpReminders() {
    const now = new Date();
    const today = toDateOnlyText(now);

    const completedOncologyAppointments = await appointmentModel.findAll({
        where: {
            status: "completed",
        },
        include: [
            {
                model: doctorModel,
                as: "doctor",
                attributes: ["uuid", "specialization"],
                where: {
                    specialization: REMINDER_SPECIALTY,
                },
            },
        ],
        attributes: ["uuid", "patientUuid", "date", "timeSlot"],
        order: [
            ["patientUuid", "ASC"],
            ["date", "DESC"],
            ["timeSlot", "DESC"],
        ],
    });

    const latestCompletedByPatient = new Map();

    for (const appointment of completedOncologyAppointments) {
        if (!latestCompletedByPatient.has(appointment.patientUuid)) {
            latestCompletedByPatient.set(appointment.patientUuid, appointment);
        }
    }

    let sentCount = 0;

    for (const appointment of latestCompletedByPatient.values()) {
        if (!hasAtLeastThirtyDaysElapsed(appointment.date, now)) {
            continue;
        }

        const hasFutureOncologyAppointment = await appointmentModel.findOne({
            where: {
                patientUuid: appointment.patientUuid,
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
                        specialization: REMINDER_SPECIALTY,
                    },
                },
            ],
            attributes: ["uuid"],
        });

        if (hasFutureOncologyAppointment) {
            continue;
        }

        const existingReminder = await followUpReminderModel.findOne({
            where: {
                patientUuid: appointment.patientUuid,
                appointmentUuid: appointment.uuid,
                reminderType: REMINDER_TYPE,
            },
        });

        if (existingReminder) {
            continue;
        }

        await createNotification({
            userId: appointment.patientUuid,
            type: "follow_up_reminder",
            title: "Follow-up appointment reminder",
            body: "You can schedule a follow-up appointment from the app.",
            data: {
                specialty: REMINDER_SPECIALTY,
                lastAppointmentId: appointment.uuid,
                url: "/appointments/new?specialty=oncology",
            },
            sendPush: true,
        });

        await followUpReminderModel.create({
            patientUuid: appointment.patientUuid,
            appointmentUuid: appointment.uuid,
            reminderType: REMINDER_TYPE,
            sentAt: now,
        });

        sentCount += 1;
    }

    return {
        evaluatedPatients: latestCompletedByPatient.size,
        sentCount,
    };
}
