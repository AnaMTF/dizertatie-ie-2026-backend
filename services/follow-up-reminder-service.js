import { Op } from "sequelize";

import {
    appointmentModel,
    doctorModel,
    followUpReminderModel,
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

function getReminderType(specialty) {
    return `${specialty}_follow_up`;
}

function toSpecialtyLabel(specialty) {
    return specialty.charAt(0).toUpperCase() + specialty.slice(1);
}

export async function sendDueFollowUpReminders() {
    const now = new Date();
    const today = toDateOnlyText(now);

    const completedAppointments = await appointmentModel.findAll({
        where: {
            status: "completed",
        },
        include: [
            {
                model: doctorModel,
                as: "doctor",
                attributes: ["uuid", "specialization"],
            },
        ],
        attributes: ["uuid", "patientUuid", "date", "timeSlot"],
        order: [
            ["patientUuid", "ASC"],
            ["date", "DESC"],
            ["timeSlot", "DESC"],
        ],
    });

    // Group by patient+specialty; keep only the latest completed per pair
    const latestByPatientSpecialty = new Map();

    for (const appointment of completedAppointments) {
        const specialty = appointment.doctor?.specialization;
        if (!specialty) {
            continue;
        }

        const key = `${appointment.patientUuid}:${specialty}`;

        if (!latestByPatientSpecialty.has(key)) {
            latestByPatientSpecialty.set(key, appointment);
        }
    }

    let sentCount = 0;

    for (const appointment of latestByPatientSpecialty.values()) {
        const specialty = appointment.doctor.specialization;

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
                        specialization: specialty,
                    },
                },
            ],
            attributes: ["uuid"],
        });

        if (hasFutureAppointment) {
            continue;
        }

        const existingReminder = await followUpReminderModel.findOne({
            where: {
                patientUuid: appointment.patientUuid,
                appointmentUuid: appointment.uuid,
                reminderType: getReminderType(specialty),
            },
        });

        if (existingReminder) {
            continue;
        }

        const label = toSpecialtyLabel(specialty);

        await createNotification({
            userId: appointment.patientUuid,
            type: "follow_up_reminder",
            title: `${label} follow-up reminder`,
            body: `It's been over ${FOLLOW_UP_INTERVAL_DAYS} days since your last ${specialty} appointment. Consider scheduling a follow-up.`,
            data: {
                specialty,
                lastAppointmentId: appointment.uuid,
                url: `/appointments?create=true&specialty=${encodeURIComponent(specialty)}`,
            },
            sendPush: true,
        });

        await followUpReminderModel.create({
            patientUuid: appointment.patientUuid,
            appointmentUuid: appointment.uuid,
            reminderType: getReminderType(specialty),
            sentAt: now,
        });

        sentCount += 1;
    }

    return {
        evaluatedPatientSpecialties: latestByPatientSpecialty.size,
        sentCount,
    };
}
