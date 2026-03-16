import {
    appointmentModel,
    clinicModel,
    doctorModel,
    patientModel,
} from "../models/index.js";

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

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
];

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

    const appointment = await appointmentModel.create({
        dateTime: data.dateTime,
        patientUuid: user.uuid,
        doctorUuid: data.doctorUuid,
        clinicUuid: data.clinicUuid,
        status: "scheduled",
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

    appointment.dateTime = data.dateTime;
    appointment.status = data.status;
    appointment.cancellationReason =
        data.status === "cancelled" ? (data.cancellationReason ?? null) : null;
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
        order: [["dateTime", "ASC"]],
    });
}

export async function getAppointmentsByDoctorUuid(doctorUuid) {
    return appointmentModel.findAll({
        where: { doctorUuid },
        include: appointmentInclude,
        order: [["dateTime", "ASC"]],
    });
}
