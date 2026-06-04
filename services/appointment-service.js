import { Op } from "sequelize";
import { fileTypeFromFile } from "file-type";

import database from "../database/index.js";
import {
    appointmentDocumentModel,
    appointmentModel,
    clinicModel,
    doctorModel,
    followUpReminderModel,
    patientModel,
    scanImageModel,
    scanModel,
} from "../models/index.js";
import { createError } from "../utils/error.js";
import { createNotification } from "./notification-service.js";

const SLOT_TIMES = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const DATE_REGEXP = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEXP = /^\d{4}-\d{2}$/;
const APPOINTMENT_STATUSES = new Set([
    "scheduled",
    "confirmed",
    "cancelled",
    "rescheduled",
    "completed",
]);

const appointmentInclude = [
    {
        model: patientModel,
        as: "patient",
        attributes: ["uuid", "email", "firstName", "lastName"],
    },
    {
        model: doctorModel,
        as: "doctor",
        attributes: [
            "uuid",
            "email",
            "firstName",
            "lastName",
            "specialization",
            "clinicUuid",
        ],
    },
    {
        model: clinicModel,
        as: "clinic",
    },
    {
        model: appointmentDocumentModel,
        as: "documents",
        attributes: ["uuid", "fileName", "mimeType", "createdAt"],
    },
    {
        model: followUpReminderModel,
        as: "followUpReminder",
        attributes: [
            "uuid",
            "reminderType",
            "sentAt",
            "doctorFollowUpRecommendation",
            "doctorFollowUpDate",
        ],
    },
];

function getDaysInMonth(monthValue) {
    const [yearText, monthText] = monthValue.split("-");
    const year = Number(yearText);
    const month = Number(monthText);

    return new Date(year, month, 0).getDate();
}

function buildDateListFromMonth(monthValue) {
    const daysInMonth = getDaysInMonth(monthValue);

    return Array.from({ length: daysInMonth }, (_, index) => {
        const day = String(index + 1).padStart(2, "0");
        return `${monthValue}-${day}`;
    });
}

function computeAvailability(appointments, dateList) {
    const bookedByDate = new Map(dateList.map((date) => [date, new Set()]));

    for (const appointment of appointments) {
        const { date, timeSlot } = appointment;

        if (!bookedByDate.has(date) || !SLOT_TIMES.includes(timeSlot)) {
            continue;
        }

        bookedByDate.get(date).add(timeSlot);
    }

    return dateList.map((date) => {
        const bookedSet = bookedByDate.get(date) ?? new Set();
        const bookedSlots = SLOT_TIMES.filter((slot) => bookedSet.has(slot));
        const availableSlots = SLOT_TIMES.filter(
            (slot) => !bookedSet.has(slot),
        );

        return {
            date,
            bookedSlots,
            availableSlots,
            hasAvailability: availableSlots.length > 0,
        };
    });
}

function asTrimmedQueryValue(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

async function ensureDoctorAndClinic(doctorUuid, clinicUuid) {
    const doctor = await doctorModel.findByPk(doctorUuid);

    if (!doctor) {
        throw createError(404, "Doctor not found");
    }

    if (doctor.clinicUuid !== clinicUuid) {
        throw createError(400, "Doctor does not belong to selected clinic");
    }

    return doctor;
}

function normalizeScheduleInput(data) {
    if (data.date && data.timeSlot) {
        return {
            date: data.date,
            timeSlot: data.timeSlot,
        };
    }

    throw createError(
        400,
        "Provide both date and timeSlot in appointment payload",
    );
}

function toAppointmentTargetDateTime(date, timeSlot) {
    const targetDateTime = new Date(`${date}T${timeSlot}:00`);

    if (Number.isNaN(targetDateTime.getTime())) {
        return null;
    }

    return targetDateTime.toISOString();
}

function addDaysToDateText(dateText, daysToAdd) {
    const date = new Date(`${dateText}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    date.setUTCDate(date.getUTCDate() + daysToAdd);
    return date.toISOString().slice(0, 10);
}

function getFollowUpReminderType(specialization) {
    return `${specialization || "general"}_follow_up`;
}

async function clearFollowUpRemindersBySpecialty(patientUuid, doctorUuid) {
    try {
        const doctor = await doctorModel.findByPk(doctorUuid, {
            attributes: ["specialization"],
        });

        if (!doctor) {
            return;
        }

        const reminderType = getFollowUpReminderType(doctor.specialization);

        await followUpReminderModel.destroy({
            where: {
                patientUuid,
                reminderType,
            },
        });
    } catch (error) {
        console.error("Failed to clear follow-up reminders", error);
    }
}

async function ensureSlotNotBooked(
    doctorUuid,
    date,
    timeSlot,
    excludedAppointmentUuid = null,
) {
    const where = {
        doctorUuid,
        date,
        timeSlot,
        status: {
            [Op.ne]: "cancelled",
        },
    };

    if (excludedAppointmentUuid) {
        where.uuid = {
            [Op.ne]: excludedAppointmentUuid,
        };
    }

    const existing = await appointmentModel.findOne({ where });

    if (existing) {
        throw createError(409, "Selected slot is already booked");
    }
}

async function resolveStoredMimeType(filePath) {
    const fileType = await fileTypeFromFile(filePath);
    return fileType?.mime || "application/octet-stream";
}

function getExtensionFromMimeType(mimeType) {
    const mimeTypeMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/bmp": "bmp",
        "image/tiff": "tiff",
        "application/pdf": "pdf",
    };

    return mimeTypeMap[mimeType] || "bin";
}

async function createAppointmentDocumentsFromScan({
    appointmentUuid,
    scanUuid,
    patientUuid,
    transaction,
}) {
    const scan = await scanModel.findOne({
        where: {
            uuid: scanUuid,
            patientUuid,
        },
        include: [
            {
                model: scanImageModel,
                as: "images",
                attributes: ["uuid", "filePath", "mimeType"],
            },
        ],
        transaction,
    });

    if (!scan) {
        throw createError(404, "Scan not found");
    }

    if (!Array.isArray(scan.images) || scan.images.length === 0) {
        throw createError(400, "Selected AI scan has no images to attach");
    }

    await appointmentDocumentModel.bulkCreate(
        scan.images.map((image, index) => ({
            appointmentUuid,
            filePath: image.filePath,
            mimeType: image.mimeType || "application/octet-stream",
            fileName: `ai-scan-${scanUuid}-image-${index + 1}.${getExtensionFromMimeType(image.mimeType)}`,
        })),
        { transaction },
    );
}

async function getOwnedAppointment(appointmentUuid, user) {
    const appointment = await appointmentModel.findByPk(appointmentUuid);

    if (!appointment) {
        return null;
    }

    if (user.role === "patient" && appointment.patientUuid !== user.uuid) {
        throw createError(
            403,
            "Patients can only access their own appointments",
        );
    }

    if (user.role === "doctor" && appointment.doctorUuid !== user.uuid) {
        throw createError(
            403,
            "Doctors can only access their own appointments",
        );
    }

    return appointment;
}

export async function createAppointment(data, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can create appointments");
    }

    const patient = await patientModel.findByPk(user.uuid);

    if (!patient) {
        throw createError(
            401,
            "Authenticated patient account was not found. Please log in again.",
        );
    }

    const { date, timeSlot } = normalizeScheduleInput(data);

    const doctor = await ensureDoctorAndClinic(
        data.doctorUuid,
        data.clinicUuid,
    );
    await ensureSlotNotBooked(data.doctorUuid, date, timeSlot);

    const appointment = await database.transaction(async (transaction) => {
        const createdAppointment = await appointmentModel.create(
            {
                date,
                timeSlot,
                patientUuid: patient.uuid,
                doctorUuid: data.doctorUuid,
                clinicUuid: data.clinicUuid,
                status: "scheduled",
                notes: data.notes ?? null,
            },
            { transaction },
        );

        if (data.scanUuid) {
            await createAppointmentDocumentsFromScan({
                appointmentUuid: createdAppointment.uuid,
                scanUuid: data.scanUuid,
                patientUuid: patient.uuid,
                transaction,
            });
        }

        return createdAppointment;
    });

    try {
        await createNotification({
            userId: doctor.uuid,
            recipientRole: "doctor",
            type: "doctor_new_appointment",
            priority: "high",
            title: "New appointment request",
            body: `${patient.firstName} ${patient.lastName} booked ${date} at ${timeSlot}.`,
            data: {
                category: "doctor_new_appointment",
                appointmentUuid: appointment.uuid,
                patientUuid: patient.uuid,
                patientName: `${patient.firstName} ${patient.lastName}`,
                date,
                timeSlot,
                url: `/doctor/appointments?appointment=${appointment.uuid}`,
            },
            sendPush: true,
        });
    } catch (error) {
        console.error(
            "Failed to send doctor new appointment notification",
            error,
        );
    }

    try {
        await createNotification({
            userId: patient.uuid,
            type: "system_message",
            priority: "high",
            title: "Appointment reminder",
            body: `Your consultation is scheduled for ${date} at ${timeSlot}.`,
            data: {
                category: "appointment_reminder",
                reminderKind: "appointment",
                appointmentUuid: appointment.uuid,
                date,
                timeSlot,
                doctorUuid: doctor.uuid,
                doctorName: `Dr. ${doctor.lastName}`,
                specialty: doctor.specialization ?? null,
                targetDateTime: toAppointmentTargetDateTime(date, timeSlot),
                url: `/appointments?appointment=${appointment.uuid}`,
            },
            sendPush: true,
        });
    } catch (error) {
        console.error(
            "Failed to send patient appointment reminder notification",
            error,
        );
    }

    try {
        await clearFollowUpRemindersBySpecialty(
            appointment.patientUuid,
            appointment.doctorUuid,
        );
    } catch (error) {
        console.error(
            "Failed to clear follow-up reminders on new appointment",
            error,
        );
    }

    return appointmentModel.findByPk(appointment.uuid, {
        include: appointmentInclude,
    });
}

export async function replaceAppointment(uuid, data, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can replace appointments");
    }

    const appointment = await getOwnedAppointment(uuid, user);

    if (!appointment) {
        return null;
    }

    const previousDate = appointment.date;
    const previousTimeSlot = appointment.timeSlot;
    const previousStatus = appointment.status;

    const { date, timeSlot } = normalizeScheduleInput(data);

    await ensureDoctorAndClinic(appointment.doctorUuid, appointment.clinicUuid);
    await ensureSlotNotBooked(appointment.doctorUuid, date, timeSlot, uuid);

    if (data.status === "completed" || data.status === "confirmed") {
        throw createError(
            403,
            "Patients cannot mark appointments as confirmed or completed",
        );
    }

    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.status = data.status;
    appointment.cancellationReason =
        data.status === "cancelled" ? (data.cancellationReason ?? null) : null;
    appointment.notes = data.notes ?? null;
    await appointment.save();

    if (
        previousDate !== appointment.date ||
        previousTimeSlot !== appointment.timeSlot
    ) {
        try {
            await createNotification({
                userId: appointment.doctorUuid,
                recipientRole: "doctor",
                type: "doctor_appointment_rescheduled",
                priority: "medium",
                title: "Appointment rescheduled",
                body: `A patient changed the consultation to ${appointment.date} at ${appointment.timeSlot}.`,
                data: {
                    category: "doctor_appointment_rescheduled",
                    appointmentUuid: appointment.uuid,
                    patientUuid: appointment.patientUuid,
                    previousDate,
                    previousTimeSlot,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/doctor/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send doctor reschedule notification",
                error,
            );
        }
    }

    if (previousStatus !== "cancelled" && appointment.status === "cancelled") {
        try {
            await createNotification({
                userId: appointment.doctorUuid,
                recipientRole: "doctor",
                type: "doctor_appointment_cancelled",
                priority: "medium",
                title: "Appointment cancelled",
                body: "A patient cancelled an upcoming consultation.",
                data: {
                    category: "doctor_appointment_cancelled",
                    appointmentUuid: appointment.uuid,
                    patientUuid: appointment.patientUuid,
                    cancellationReason: appointment.cancellationReason ?? null,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/doctor/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send doctor cancellation notification",
                error,
            );
        }
    }

    return appointmentModel.findByPk(appointment.uuid, {
        include: appointmentInclude,
    });
}

export async function updateAppointment(uuid, data, user) {
    const appointment = await getOwnedAppointment(uuid, user);

    if (!appointment) {
        return null;
    }

    const previousStatus = appointment.status;
    const previousDate = appointment.date;
    const previousTimeSlot = appointment.timeSlot;
    let shouldNotifyDoctorRescheduled = false;

    if (user.role === "patient") {
        const hasDoctorResultFields =
            data.doctorDiagnosis !== undefined ||
            data.doctorPrescription !== undefined ||
            data.doctorFollowUpRecommendation !== undefined ||
            data.doctorFollowUpDate !== undefined;

        if (hasDoctorResultFields) {
            throw createError(
                403,
                "Patients cannot modify doctor consultation results",
            );
        }

        const isRescheduling =
            data.date !== undefined || data.timeSlot !== undefined;

        if (isRescheduling) {
            const { date, timeSlot } = normalizeScheduleInput(data);

            await ensureSlotNotBooked(
                appointment.doctorUuid,
                date,
                timeSlot,
                appointment.uuid,
            );
            appointment.date = date;
            appointment.timeSlot = timeSlot;
            shouldNotifyDoctorRescheduled =
                previousDate !== date || previousTimeSlot !== timeSlot;

            if (shouldNotifyDoctorRescheduled) {
                appointment.status = "rescheduled";
            }
        }

        if (data.status !== undefined) {
            if (data.status === "completed" || data.status === "confirmed") {
                throw createError(
                    403,
                    "Patients cannot mark appointments as confirmed or completed",
                );
            }

            if (
                data.status !== "rescheduled" ||
                shouldNotifyDoctorRescheduled
            ) {
                appointment.status = data.status;
            }
        }

        if (data.cancellationReason !== undefined) {
            appointment.cancellationReason = data.cancellationReason;
        }

        if (data.notes !== undefined) {
            appointment.notes = data.notes;
        }
    } else if (user.role === "doctor") {
        if (data.date !== undefined || data.timeSlot !== undefined) {
            throw createError(
                403,
                "Doctors cannot modify appointment date or time",
            );
        }

        if (data.notes !== undefined) {
            throw createError(
                403,
                "Doctors cannot modify patient appointment notes",
            );
        }

        if (data.status !== undefined) {
            const allowedTransitions = {
                scheduled: ["scheduled", "confirmed", "cancelled"],
                confirmed: ["confirmed", "cancelled", "completed"],
                rescheduled: [
                    "rescheduled",
                    "confirmed",
                    "cancelled",
                    "completed",
                ],
                cancelled: ["cancelled"],
                completed: ["completed"],
            };

            const allowedTargetStatuses =
                allowedTransitions[appointment.status] || [];

            if (!allowedTargetStatuses.includes(data.status)) {
                throw createError(
                    403,
                    "Doctors cannot apply this status transition",
                );
            }

            appointment.status = data.status;
        }

        let hasDoctorResultChanges = false;

        if (data.doctorDiagnosis !== undefined) {
            appointment.doctorDiagnosis = data.doctorDiagnosis;
            hasDoctorResultChanges = true;
        }

        if (data.doctorPrescription !== undefined) {
            appointment.doctorPrescription = data.doctorPrescription;
            hasDoctorResultChanges = true;
        }

        if (
            data.doctorFollowUpRecommendation !== undefined ||
            data.doctorFollowUpDate !== undefined
        ) {
            hasDoctorResultChanges = true;
        }

        if (hasDoctorResultChanges) {
            appointment.doctorResultsUpdatedAt = new Date();
        }

        if (data.cancellationReason !== undefined) {
            if (appointment.status !== "cancelled") {
                throw createError(
                    400,
                    "cancellationReason can only be set for cancelled appointments",
                );
            }

            appointment.cancellationReason = data.cancellationReason;
        }

        if (appointment.status === "completed") {
            const diagnosis = String(appointment.doctorDiagnosis ?? "").trim();
            const prescription = String(
                appointment.doctorPrescription ?? "",
            ).trim();
            const followUpRecommendation = String(
                data.doctorFollowUpRecommendation ?? "",
            ).trim();

            if (!diagnosis || !prescription || !followUpRecommendation) {
                throw createError(
                    400,
                    "Diagnosis, prescription, and follow-up recommendation are required before completing an appointment",
                );
            }
        }
    } else {
        throw createError(403, "Forbidden");
    }

    await appointment.save();

    if (
        user.role === "doctor" &&
        previousStatus !== "completed" &&
        appointment.status === "completed"
    ) {
        try {
            const doctor = await doctorModel.findByPk(appointment.doctorUuid, {
                attributes: ["specialization"],
            });

            const reminderType = getFollowUpReminderType(
                doctor?.specialization ?? null,
            );

            const [reminder] = await followUpReminderModel.findOrCreate({
                where: {
                    patientUuid: appointment.patientUuid,
                    appointmentUuid: appointment.uuid,
                    reminderType,
                },
                defaults: {
                    patientUuid: appointment.patientUuid,
                    appointmentUuid: appointment.uuid,
                    reminderType,
                    sentAt: new Date(),
                    doctorFollowUpRecommendation:
                        data.doctorFollowUpRecommendation ?? null,
                    doctorFollowUpDate: data.doctorFollowUpDate ?? null,
                },
            });

            await appointment.update({ followUpReminderUuid: reminder.uuid });
        } catch (error) {
            console.error("Failed to persist follow-up reminder entry", error);
        }
    }

    if (user.role === "patient" && shouldNotifyDoctorRescheduled) {
        try {
            await createNotification({
                userId: appointment.doctorUuid,
                recipientRole: "doctor",
                type: "doctor_appointment_rescheduled",
                priority: "medium",
                title: "Appointment rescheduled",
                body: `A patient changed the consultation to ${appointment.date} at ${appointment.timeSlot}.`,
                data: {
                    category: "doctor_appointment_rescheduled",
                    appointmentUuid: appointment.uuid,
                    patientUuid: appointment.patientUuid,
                    previousDate,
                    previousTimeSlot,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/doctor/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send doctor reschedule notification",
                error,
            );
        }
    }

    if (
        user.role === "patient" &&
        previousStatus !== "cancelled" &&
        appointment.status === "cancelled"
    ) {
        try {
            await createNotification({
                userId: appointment.doctorUuid,
                recipientRole: "doctor",
                type: "doctor_appointment_cancelled",
                priority: "medium",
                title: "Appointment cancelled",
                body: "A patient cancelled an upcoming consultation.",
                data: {
                    category: "doctor_appointment_cancelled",
                    appointmentUuid: appointment.uuid,
                    patientUuid: appointment.patientUuid,
                    cancellationReason: appointment.cancellationReason ?? null,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/doctor/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send doctor cancellation notification",
                error,
            );
        }

        try {
            await createNotification({
                userId: appointment.patientUuid,
                type: "appointment_cancelled",
                priority: "high",
                title: "Appointment cancelled",
                body: "You have cancelled your consultation.",
                data: {
                    category: "appointment_cancelled",
                    appointmentUuid: appointment.uuid,
                    cancellationReason: appointment.cancellationReason ?? null,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send patient cancellation notification",
                error,
            );
        }
    }

    if (
        user.role === "doctor" &&
        previousStatus !== "confirmed" &&
        appointment.status === "confirmed"
    ) {
        try {
            await createNotification({
                userId: appointment.patientUuid,
                type: "appointment_confirmed",
                priority: "medium",
                title: "Appointment confirmed",
                body: `Your doctor has confirmed your consultation on ${appointment.date} at ${appointment.timeSlot}.`,
                data: {
                    category: "appointment_confirmed",
                    appointmentUuid: appointment.uuid,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send appointment confirmation notification",
                error,
            );
        }
    }

    if (
        user.role === "doctor" &&
        previousStatus !== "cancelled" &&
        appointment.status === "cancelled"
    ) {
        try {
            await createNotification({
                userId: appointment.patientUuid,
                type: "appointment_cancelled",
                priority: "high",
                title: "Appointment cancelled",
                body: "Your doctor has cancelled your consultation.",
                data: {
                    category: "appointment_cancelled",
                    appointmentUuid: appointment.uuid,
                    cancellationReason: appointment.cancellationReason ?? null,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    url: `/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send appointment cancellation notification to patient",
                error,
            );
        }
    }

    if (
        user.role === "doctor" &&
        previousStatus !== "completed" &&
        appointment.status === "completed"
    ) {
        try {
            await createNotification({
                userId: appointment.patientUuid,
                type: "system_message",
                priority: "low",
                title: "Consultation completed",
                body: "Your doctor has completed your consultation. View your results.",
                data: {
                    category: "consultation_completed",
                    appointmentUuid: appointment.uuid,
                    url: `/appointments?appointment=${appointment.uuid}`,
                },
                sendPush: true,
            });
        } catch (error) {
            console.error(
                "Failed to send consultation completion notification",
                error,
            );
        }
    }

    return appointmentModel.findByPk(appointment.uuid, {
        include: appointmentInclude,
    });
}

export async function deleteAppointment(uuid, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can delete appointments");
    }

    const appointment = await getOwnedAppointment(uuid, user);

    if (!appointment) {
        return false;
    }

    await appointment.destroy();
    return true;
}

function normalizeAppointmentFilters(query, user) {
    const status = asTrimmedQueryValue(query?.status);
    const patientUuid = asTrimmedQueryValue(query?.patientUuid);

    if (status && !APPOINTMENT_STATUSES.has(status)) {
        throw createError(400, "Invalid appointment status filter");
    }

    if (patientUuid && user.role !== "doctor") {
        throw createError(403, "Only doctors can filter by patientUuid");
    }

    return {
        status: status || null,
        patientUuid: patientUuid || null,
    };
}

export async function getAppointments(user, query) {
    const filters = normalizeAppointmentFilters(query, user);

    if (user.role === "patient") {
        return getAppointmentsByPatientUuid(user.uuid, filters);
    }

    if (user.role === "doctor") {
        return getAppointmentsByDoctorUuid(user.uuid, filters);
    }

    throw createError(403, "Forbidden");
}

export async function getFollowUpReminders(user) {
    if (user.role !== "patient" && user.role !== "doctor") {
        throw createError(403, "Forbidden");
    }

    const appointmentWhere = {
        status: "completed",
    };

    if (user.role === "doctor") {
        appointmentWhere.doctorUuid = user.uuid;
    }

    const reminderWhere = {};

    if (user.role === "patient") {
        reminderWhere.patientUuid = user.uuid;
    }

    const reminders = await followUpReminderModel.findAll({
        where: reminderWhere,
        include: [
            {
                model: appointmentModel,
                as: "appointment",
                required: true,
                where: appointmentWhere,
                attributes: [
                    "uuid",
                    "date",
                    "timeSlot",
                    "doctorUuid",
                    "patientUuid",
                ],
                include: [
                    {
                        model: doctorModel,
                        as: "doctor",
                        attributes: [
                            "uuid",
                            "firstName",
                            "lastName",
                            "specialization",
                        ],
                    },
                    {
                        model: patientModel,
                        as: "patient",
                        attributes: ["uuid", "firstName", "lastName"],
                    },
                    {
                        model: clinicModel,
                        as: "clinic",
                        attributes: ["uuid", "name"],
                    },
                ],
            },
        ],
        order: [["sentAt", "DESC"]],
    });

    const mappedReminders = reminders
        .map((reminder) => {
            const appointment = reminder.appointment;
            const doctor = appointment?.doctor;
            const targetDate =
                reminder.doctorFollowUpDate ||
                addDaysToDateText(appointment?.date, 30);

            if (!appointment || !targetDate) {
                return null;
            }

            const today = new Date();
            const targetDateObj = new Date(`${targetDate}T00:00:00Z`);
            if (targetDateObj < today) {
                return null;
            }

            return {
                uuid: reminder.uuid,
                appointmentUuid: appointment.uuid,
                reminderType: reminder.reminderType,
                createdAt: reminder.sentAt,
                targetDate,
                recommendation: reminder.doctorFollowUpRecommendation || null,
                doctorName: doctor ? `Dr. ${doctor.lastName}` : null,
                specialty: doctor?.specialization || null,
                clinicName: appointment.clinic?.name || null,
                patientName: appointment.patient
                    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                    : null,
                url:
                    user.role === "patient"
                        ? `/appointments?create=true&doctorUuid=${appointment.doctorUuid}`
                        : `/doctor/appointments?appointment=${appointment.uuid}`,
            };
        })
        .filter(Boolean)
        .sort((first, second) => {
            const firstDate = new Date(
                `${first.targetDate}T00:00:00`,
            ).getTime();
            const secondDate = new Date(
                `${second.targetDate}T00:00:00`,
            ).getTime();

            if (firstDate === secondDate) {
                return (
                    new Date(second.createdAt).getTime() -
                    new Date(first.createdAt).getTime()
                );
            }

            return firstDate - secondDate;
        });

    return mappedReminders;
}

export async function getAppointmentAvailability(query, user) {
    if (user.role !== "patient" && user.role !== "doctor") {
        throw createError(403, "Forbidden");
    }

    const { doctorUuid, clinicUuid, date, month } = query;

    if (!doctorUuid) {
        throw createError(400, "doctorUuid query parameter is required");
    }

    if (user.role === "doctor" && user.uuid !== doctorUuid) {
        throw createError(
            403,
            "Doctors can only inspect their own availability",
        );
    }

    const doctor = await doctorModel.findByPk(doctorUuid);

    if (!doctor) {
        throw createError(404, "Doctor not found");
    }

    if (clinicUuid && clinicUuid !== doctor.clinicUuid) {
        throw createError(400, "Doctor does not belong to selected clinic");
    }

    if (date && month) {
        throw createError(
            400,
            "Use either date or month query parameter, not both",
        );
    }

    if (!date && !month) {
        throw createError(
            400,
            "Either date or month query parameter is required",
        );
    }

    if (date && !DATE_REGEXP.test(date)) {
        throw createError(400, "date must use YYYY-MM-DD format");
    }

    if (month && !MONTH_REGEXP.test(month)) {
        throw createError(400, "month must use YYYY-MM format");
    }

    const appointments = await appointmentModel.findAll({
        where: {
            doctorUuid,
            status: {
                [Op.ne]: "cancelled",
            },
        },
        attributes: ["uuid", "date", "timeSlot", "status"],
    });

    if (date) {
        const [dayAvailability] = computeAvailability(appointments, [date]);

        return {
            doctorUuid,
            clinicUuid: doctor.clinicUuid,
            ...dayAvailability,
        };
    }

    const dateList = buildDateListFromMonth(month);
    const days = computeAvailability(appointments, dateList);

    return {
        doctorUuid,
        clinicUuid: doctor.clinicUuid,
        month,
        days,
        availableDates: days
            .filter((item) => item.hasAvailability)
            .map((item) => item.date),
    };
}

export async function createAppointmentDocuments(
    appointmentUuid,
    data,
    files,
    user,
) {
    if (user.role !== "patient") {
        throw createError(
            403,
            "Only patients can upload appointment documents",
        );
    }

    const appointment = await getOwnedAppointment(appointmentUuid, user);

    if (!appointment) {
        throw createError(404, "Appointment not found");
    }

    if (!files?.length) {
        throw createError(400, "At least one document is required");
    }

    if (!Array.isArray(data) || data.length !== files.length) {
        throw createError(
            400,
            "Each uploaded document must have one metadata item",
        );
    }

    const detectedMimeTypes = await Promise.all(
        files.map((file) => resolveStoredMimeType(file.path)),
    );

    await database.transaction(async (transaction) => {
        await appointmentDocumentModel.bulkCreate(
            files.map((file, index) => ({
                appointmentUuid,
                filePath: file.path,
                mimeType: detectedMimeTypes[index],
                fileName:
                    data[index]?.fileName?.trim() ||
                    file.originalname ||
                    `document-${index + 1}`,
            })),
            { transaction },
        );
    });

    return appointmentModel.findByPk(appointmentUuid, {
        include: appointmentInclude,
    });
}

export async function getAppointmentDocumentByUuid(
    appointmentUuid,
    documentUuid,
    user,
) {
    await getOwnedAppointment(appointmentUuid, user);

    const document = await appointmentDocumentModel.findOne({
        where: {
            uuid: documentUuid,
            appointmentUuid,
        },
    });

    if (!document) {
        throw createError(404, "Document not found");
    }

    return document;
}

export async function deleteAppointmentDocument(
    appointmentUuid,
    documentUuid,
    user,
) {
    if (user.role !== "patient") {
        throw createError(
            403,
            "Only patients can delete appointment documents",
        );
    }

    const appointment = await getOwnedAppointment(appointmentUuid, user);

    if (!appointment) {
        return false;
    }

    if (
        appointment.status === "confirmed" ||
        appointment.status === "completed" ||
        appointment.status === "cancelled"
    ) {
        throw createError(
            403,
            "Cannot delete documents from a confirmed, completed, or cancelled appointment",
        );
    }

    const document = await appointmentDocumentModel.findOne({
        where: {
            uuid: documentUuid,
            appointmentUuid,
        },
    });

    if (!document) {
        return false;
    }

    await document.destroy();

    return true;
}

export async function getAppointmentByUuid(uuid, user) {
    await getOwnedAppointment(uuid, user);

    return appointmentModel.findByPk(uuid, {
        include: appointmentInclude,
    });
}

export async function getAppointmentsByPatientUuid(patientUuid, filters = {}) {
    const where = { patientUuid };

    if (filters.status) {
        where.status = filters.status;
    }

    return appointmentModel.findAll({
        where,
        include: appointmentInclude,
        order: [
            ["date", "ASC"],
            ["timeSlot", "ASC"],
        ],
    });
}

export async function getAppointmentsByDoctorUuid(doctorUuid, filters = {}) {
    const where = { doctorUuid };

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.patientUuid) {
        where.patientUuid = filters.patientUuid;
    }

    return appointmentModel.findAll({
        where,
        include: appointmentInclude,
        order: [
            ["date", "ASC"],
            ["timeSlot", "ASC"],
        ],
    });
}
