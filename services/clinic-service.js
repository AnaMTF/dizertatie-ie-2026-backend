import { clinicModel } from "../models/index.js";

export async function createClinic(data) {
    return clinicModel.create(data);
}

export async function replaceClinic(uuid, data) {
    const [updatedRows] = await clinicModel.update(data, {
        where: { uuid },
    });

    if (!updatedRows) {
        return null;
    }

    return clinicModel.findByPk(uuid);
}

export async function updateClinic(uuid, data) {
    const [updatedRows] = await clinicModel.update(data, {
        where: { uuid },
    });

    if (!updatedRows) {
        return null;
    }

    return clinicModel.findByPk(uuid);
}

export async function deleteClinic(uuid) {
    const deletedRows = await clinicModel.destroy({
        where: { uuid },
    });

    return deletedRows > 0;
}

export async function getClinics() {
    return clinicModel.findAll();
}

export async function getClinicByUuid(uuid) {
    return clinicModel.findByPk(uuid);
}
