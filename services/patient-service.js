import bcrypt from "bcryptjs";

import models from "../models/index.js";

const publicPatientAttributes = {
    exclude: ["passwordHash"],
};

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function ensureSelfAccess(patientId, user) {
    if (user.role !== "patient" || user.id !== Number(patientId)) {
        throw createError(403, "Patients can only access their own profile");
    }
}

async function doctorHasAccessToPatient(patientId, doctorId) {
    const appointment = await models.appointmentModel.findOne({
        where: {
            patientId,
            doctorId,
        },
    });

    return Boolean(appointment);
}

export async function createPatient(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const patient = await models.patientModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        additionalMedicalInfo: data.additionalMedicalInfo,
    });

    return models.patientModel.findByPk(patient.id, {
        attributes: publicPatientAttributes,
    });
}

export async function replacePatient(id, data, user) {
    await ensureSelfAccess(id, user);

    const [updatedRows] = await models.patientModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return models.patientModel.findByPk(id, {
        attributes: publicPatientAttributes,
    });
}

export async function updatePatient(id, data, user) {
    await ensureSelfAccess(id, user);

    const [updatedRows] = await models.patientModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return models.patientModel.findByPk(id, {
        attributes: publicPatientAttributes,
    });
}

export async function deletePatient(id, user) {
    await ensureSelfAccess(id, user);

    const deletedRows = await models.patientModel.destroy({
        where: { id },
    });

    return deletedRows > 0;
}

export async function getPatients(user) {
    if (user.role === "patient") {
        const patient = await models.patientModel.findByPk(user.id, {
            attributes: publicPatientAttributes,
        });

        return patient ? [patient] : [];
    }

    if (user.role === "doctor") {
        return models.patientModel.findAll({
            distinct: true,
            attributes: publicPatientAttributes,
            include: [
                {
                    model: models.appointmentModel,
                    as: "appointments",
                    where: { doctorId: user.id },
                    attributes: [],
                    required: true,
                },
            ],
        });
    }

    throw createError(403, "Forbidden");
}

export async function getPatientById(id, user) {
    const patientId = Number(id);

    if (user.role === "patient") {
        await ensureSelfAccess(patientId, user);
    } else if (user.role === "doctor") {
        const hasAccess = await doctorHasAccessToPatient(patientId, user.id);

        if (!hasAccess) {
            throw createError(
                403,
                "Doctors can only access patients they have appointments with",
            );
        }
    } else {
        throw createError(403, "Forbidden");
    }

    return models.patientModel.findByPk(patientId, {
        attributes: publicPatientAttributes,
    });
}
