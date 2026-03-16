import bcrypt from "bcryptjs";

import models from "../models/index.js";

const publicDoctorAttributes = {
    exclude: ["passwordHash"],
};

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function ensureSelfAccess(doctorId, user) {
    if (!user || user.role !== "doctor" || user.id !== Number(doctorId)) {
        throw createError(403, "Doctors can only update their own profile");
    }
}

export async function createDoctor(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const doctor = await models.doctorModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        specialization: data.specialization,
        clinicId: data.clinicId,
    });

    return models.doctorModel.findByPk(doctor.id, {
        attributes: publicDoctorAttributes,
    });
}

export async function replaceDoctor(id, data, user) {
    ensureSelfAccess(id, user);

    const [updatedRows] = await models.doctorModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return models.doctorModel.findByPk(id, {
        attributes: publicDoctorAttributes,
    });
}

export async function updateDoctor(id, data, user) {
    ensureSelfAccess(id, user);

    const [updatedRows] = await models.doctorModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return models.doctorModel.findByPk(id, {
        attributes: publicDoctorAttributes,
    });
}

export async function deleteDoctor(id, user) {
    ensureSelfAccess(id, user);

    const deletedRows = await models.doctorModel.destroy({
        where: { id },
    });

    return deletedRows > 0;
}

export async function getDoctors() {
    return models.doctorModel.findAll({
        attributes: publicDoctorAttributes,
        include: [
            {
                model: models.clinicModel,
                as: "clinic",
            },
        ],
    });
}

export async function getDoctorById(id) {
    return models.doctorModel.findByPk(id, {
        attributes: publicDoctorAttributes,
        include: [
            {
                model: models.clinicModel,
                as: "clinic",
            },
        ],
    });
}
