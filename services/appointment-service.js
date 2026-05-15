import { Op } from "sequelize";
import { fileTypeFromFile } from "file-type";

import database from "../database/index.js";
import {
    appointmentDocumentModel,
    appointmentModel,
    clinicModel,
    doctorModel,
    patientModel,
} from "../models/index.js";
import { createError } from "../utils/error.js";
import { createNotification } from "./notification-service.js";

const SLOT_TIMES = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const DATE_REGEXP = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEXP = /^\d{4}-\d{2}$/;

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

    await ensureDoctorAndClinic(data.doctorUuid, data.clinicUuid);
    await ensureSlotNotBooked(data.doctorUuid, date, timeSlot);

    const appointment = await appointmentModel.create({
        date,
        timeSlot,
        patientUuid: patient.uuid,
        doctorUuid: data.doctorUuid,
        clinicUuid: data.clinicUuid,
        status: "scheduled",
        notes: data.notes ?? null,
    });

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
        }

        if (data.status !== undefined) {
            if (data.status === "completed" || data.status === "confirmed") {
                throw createError(
                    403,
                    "Patients cannot mark appointments as confirmed or completed",
                );
            }

            appointment.status = data.status;
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

        if (data.doctorFollowUpRecommendation !== undefined) {
            appointment.doctorFollowUpRecommendation =
                data.doctorFollowUpRecommendation;
            hasDoctorResultChanges = true;
        }

        if (data.doctorFollowUpDate !== undefined) {
            appointment.doctorFollowUpDate = data.doctorFollowUpDate;
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
                appointment.doctorFollowUpRecommendation ?? "",
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
            await createNotification({
                userId: appointment.patientUuid,
                type: "system_message",
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

export async function getAppointments(user) {
    if (user.role === "patient") {
        return getAppointmentsByPatientUuid(user.uuid);
    }

    if (user.role === "doctor") {
        return getAppointmentsByDoctorUuid(user.uuid);
    }

    throw createError(403, "Forbidden");
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

export async function getAppointmentsByPatientUuid(patientUuid) {
    return appointmentModel.findAll({
        where: { patientUuid },
        include: appointmentInclude,
        order: [
            ["date", "ASC"],
            ["timeSlot", "ASC"],
        ],
    });
}

export async function getAppointmentsByDoctorUuid(doctorUuid) {
    return appointmentModel.findAll({
        where: { doctorUuid },
        include: appointmentInclude,
        order: [
            ["date", "ASC"],
            ["timeSlot", "ASC"],
        ],
    });
}
