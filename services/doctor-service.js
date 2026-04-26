import bcrypt from "bcryptjs";

import { clinicModel, doctorModel } from "../models/index.js";
import { createError } from "../utils/error.js";

const publicDoctorAttributes = {
    exclude: ["passwordHash"],
};

function ensureSelfAccess(doctorUuid, user) {
    if (!user || user.role !== "doctor" || user.uuid !== doctorUuid) {
        throw createError(403, "Doctors can only update their own profile");
    }
}

export async function createDoctor(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const doctor = await doctorModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        specialization: data.specialization,
        clinicUuid: data.clinicUuid,
    });

    return doctorModel.findByPk(doctor.uuid, {
        attributes: publicDoctorAttributes,
    });
}

export async function replaceDoctor(uuid, data, user) {
    ensureSelfAccess(uuid, user);

    const [updatedRows] = await doctorModel.update(data, {
        where: { uuid },
    });

    if (!updatedRows) {
        return null;
    }

    return doctorModel.findByPk(uuid, {
        attributes: publicDoctorAttributes,
    });
}

export async function updateDoctor(uuid, data, user) {
    ensureSelfAccess(uuid, user);

    const [updatedRows] = await doctorModel.update(data, {
        where: { uuid },
    });

    if (!updatedRows) {
        return null;
    }

    return doctorModel.findByPk(uuid, {
        attributes: publicDoctorAttributes,
    });
}

export async function deleteDoctor(uuid, user) {
    ensureSelfAccess(uuid, user);

    const deletedRows = await doctorModel.destroy({
        where: { uuid },
    });

    return deletedRows > 0;
}

export async function getDoctors() {
    return doctorModel.findAll({
        attributes: publicDoctorAttributes,
        include: [
            {
                model: clinicModel,
                as: "clinic",
            },
        ],
    });
}

export async function getDoctorByUuid(uuid) {
    return doctorModel.findByPk(uuid, {
        attributes: publicDoctorAttributes,
        include: [
            {
                model: clinicModel,
                as: "clinic",
            },
        ],
    });
}
