import bcrypt from "bcryptjs";

import { appointmentModel, patientModel } from "../models/index.js";
import { createError } from "../utils/error.js";
import { refreshAppointmentRecommendationsForPatient } from "./appointment-recommendation-service.js";

const HEALTH_IMPACTING_FIELDS = new Set([
    "dateOfBirth",
    "height",
    "weight",
    "sex",
    "smoker",
    "alcoholConsumptionFrequency",
    "additionalMedicalInfo",
]);

function hasHealthImpactingChanges(data) {
    return Object.keys(data).some((key) => HEALTH_IMPACTING_FIELDS.has(key));
}

const publicPatientAttributes = {
    exclude: ["passwordHash"],
};

async function ensureSelfAccess(patientUuid, user) {
    if (user.role !== "patient" || user.uuid !== patientUuid) {
        throw createError(403, "Patients can only access their own profile");
    }
}

async function doctorHasAccessToPatient(patientUuid, doctorUuid) {
    const appointment = await appointmentModel.findOne({
        where: {
            patientUuid,
            doctorUuid,
        },
    });

    return Boolean(appointment);
}

export async function createPatient(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const patient = await patientModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        sex: data.sex,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        additionalMedicalInfo: data.additionalMedicalInfo,
        smoker: data.smoker,
        alcoholConsumptionFrequency: data.alcoholConsumptionFrequency,
    });

    return patientModel.findByPk(patient.uuid, {
        attributes: publicPatientAttributes,
    });
}

export async function replacePatient(uuid, data, user) {
    await ensureSelfAccess(uuid, user);

    const [updatedRows] = await patientModel.update(data, {
        where: { uuid },
    });

    if (!updatedRows) {
        return null;
    }

    const updated = await patientModel.findByPk(uuid, {
        attributes: publicPatientAttributes,
    });

    if (updated) {
        refreshAppointmentRecommendationsForPatient(updated, {
            source: "profile_update",
            sendNotification: true,
        }).catch((error) => {
            console.error(
                "Failed to refresh recommendations after profile replace",
                error,
            );
        });
    }

    return updated;
}

export async function updatePatient(uuid, data, user) {
    await ensureSelfAccess(uuid, user);

    const [updatedRows] = await patientModel.update(data, {
        where: { uuid },
    });

    if (!updatedRows) {
        return null;
    }

    const updated = await patientModel.findByPk(uuid, {
        attributes: publicPatientAttributes,
    });

    if (updated && hasHealthImpactingChanges(data)) {
        refreshAppointmentRecommendationsForPatient(updated, {
            source: "profile_update",
            sendNotification: true,
        }).catch((error) => {
            console.error(
                "Failed to refresh recommendations after profile update",
                error,
            );
        });
    }

    return updated;
}

export async function deletePatient(uuid, user) {
    await ensureSelfAccess(uuid, user);

    const deletedRows = await patientModel.destroy({
        where: { uuid },
    });

    return deletedRows > 0;
}

export async function getPatients(user) {
    if (user.role === "patient") {
        const patient = await patientModel.findByPk(user.uuid, {
            attributes: publicPatientAttributes,
        });

        return patient ? [patient] : [];
    }

    if (user.role === "doctor") {
        return patientModel.findAll({
            distinct: true,
            attributes: publicPatientAttributes,
            include: [
                {
                    model: appointmentModel,
                    as: "appointments",
                    where: { doctorUuid: user.uuid },
                    attributes: [],
                    required: true,
                },
            ],
        });
    }

    throw createError(403, "Forbidden");
}

export async function getPatientByUuid(uuid, user) {
    if (user.role === "patient") {
        await ensureSelfAccess(uuid, user);
    } else if (user.role === "doctor") {
        const hasAccess = await doctorHasAccessToPatient(uuid, user.uuid);

        if (!hasAccess) {
            throw createError(
                403,
                "Doctors can only access patients they have appointments with",
            );
        }
    } else {
        throw createError(403, "Forbidden");
    }

    return patientModel.findByPk(uuid, {
        attributes: publicPatientAttributes,
    });
}
