import models from "../models/index.js";

export async function createClinic(data) {
    return models.clinicModel.create(data);
}

export async function replaceClinic(id, data) {
    const [updatedRows] = await models.clinicModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return models.clinicModel.findByPk(id);
}

export async function updateClinic(id, data) {
    const [updatedRows] = await models.clinicModel.update(data, {
        where: { id },
    });

    if (!updatedRows) {
        return null;
    }

    return models.clinicModel.findByPk(id);
}

export async function deleteClinic(id) {
    const deletedRows = await models.clinicModel.destroy({
        where: { id },
    });

    return deletedRows > 0;
}

export async function getClinics() {
    return models.clinicModel.findAll();
}

export async function getClinicById(id) {
    return models.clinicModel.findByPk(id);
}
