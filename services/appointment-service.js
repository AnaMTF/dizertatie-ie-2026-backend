import models from "../models/index.js";

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

const appointmentInclude = [
    {
        model: models.patientModel,
        as: "patient",
        attributes: ["id", "uuid", "email", "firstName", "lastName"],
    },
    {
        model: models.doctorModel,
        as: "doctor",
        attributes: ["id", "uuid", "email", "firstName", "lastName", "specialization", "clinicId"],
    },
    {
        model: models.clinicModel,
        as: "clinic",
    },
];

async function getOwnedAppointment(appointmentId, user) {
    const appointment = await models.appointmentModel.findByPk(appointmentId);

    if (!appointment) {
        return null;
    }

    if (user.role === "patient" && appointment.patientId !== user.id) {
        throw createError(403, "Patients can only access their own appointments");
    }

    if (user.role === "doctor" && appointment.doctorId !== user.id) {
        throw createError(403, "Doctors can only access their own appointments");
    }

    return appointment;
}

export async function createAppointment(data, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can create appointments");
    }

    const appointment = await models.appointmentModel.create({
        dateTime: data.dateTime,
        patientId: user.id,
        doctorId: data.doctorId,
        clinicId: data.clinicId,
        status: "scheduled",
    });

    return models.appointmentModel.findByPk(appointment.id, {
        include: appointmentInclude,
    });
}

export async function replaceAppointment(id, data, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can replace appointments");
    }

    const appointment = await getOwnedAppointment(id, user);

    if (!appointment) {
        return null;
    }

    appointment.dateTime = data.dateTime;
    appointment.status = data.status;
    appointment.cancellationReason = data.status === "cancelled" ? data.cancellationReason ?? null : null;
    await appointment.save();

    return models.appointmentModel.findByPk(appointment.id, {
        include: appointmentInclude,
    });
}

export async function updateAppointment(id, data, user) {
    const appointment = await getOwnedAppointment(id, user);

    if (!appointment) {
        return null;
    }

    if (user.role === "patient") {
        if (data.dateTime !== undefined) {
            appointment.dateTime = data.dateTime;
        }

        if (data.status !== undefined) {
            appointment.status = data.status;
        }

        if (data.cancellationReason !== undefined) {
            appointment.cancellationReason = data.cancellationReason;
        }
    } else if (user.role === "doctor") {
        if (data.dateTime !== undefined) {
            throw createError(403, "Doctors cannot reschedule appointments");
        }

        if (data.status !== undefined && data.status !== "cancelled") {
            throw createError(403, "Doctors can only cancel appointments");
        }

        if (data.status !== undefined) {
            appointment.status = data.status;
        }

        if (data.cancellationReason !== undefined) {
            appointment.cancellationReason = data.cancellationReason;
        }
    } else {
        throw createError(403, "Forbidden");
    }

    await appointment.save();

    return models.appointmentModel.findByPk(appointment.id, {
        include: appointmentInclude,
    });
}

export async function deleteAppointment(id, user) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can delete appointments");
    }

    const appointment = await getOwnedAppointment(id, user);

    if (!appointment) {
        return false;
    }

    await appointment.destroy();
    return true;
}

export async function getAppointments(user) {
    if (user.role === "patient") {
        return getAppointmentsByPatientId(user.id);
    }

    if (user.role === "doctor") {
        return getAppointmentsByDoctorId(user.id);
    }

    throw createError(403, "Forbidden");
}

export async function getAppointmentById(id, user) {
    await getOwnedAppointment(id, user);

    return models.appointmentModel.findByPk(id, {
        include: appointmentInclude,
    });
}

export async function getAppointmentsByPatientId(patientId) {
    return models.appointmentModel.findAll({
        where: { patientId },
        include: appointmentInclude,
        order: [["dateTime", "ASC"]],
    });
}

export async function getAppointmentsByDoctorId(doctorId) {
    return models.appointmentModel.findAll({
        where: { doctorId },
        include: appointmentInclude,
        order: [["dateTime", "ASC"]],
    });
}
