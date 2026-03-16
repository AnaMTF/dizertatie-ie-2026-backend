import { clinicModel } from "../models/index.js";

export async function createClinic(data) {
    return clinicModel.create(data);
}

export async function replaceClinic(id, data) {
    const [updatedRows] = await clinicModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return clinicModel.findByPk(id);
}

export async function updateClinic(id, data) {
    const [updatedRows] = await clinicModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return clinicModel.findByPk(id);
}

export async function deleteClinic(id) {
    const deletedRows = await clinicModel.destroy({
        where: { id },
    });

    return deletedRows > 0;
}

export async function getClinics() {
    return clinicModel.findAll();
}

export async function getClinicById(id) {
    return clinicModel.findByPk(id);
}
