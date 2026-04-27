import { appointmentModel } from "./appointment-model.js";
import { appointmentDocumentModel } from "./appointment-document-model.js";
import { clinicModel } from "./clinic-model.js";
import { doctorModel } from "./doctor-model.js";
import { patientModel } from "./patient-model.js";
import { scanModel } from "./scan-model.js";
import { scanImageModel } from "./scan-image-model.js";

clinicModel.hasMany(doctorModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "doctors",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

doctorModel.belongsTo(clinicModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "clinic",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

patientModel.hasMany(appointmentModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "appointments",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

doctorModel.hasMany(appointmentModel, {
    foreignKey: {
        name: "doctorUuid",
        allowNull: false,
    },
    as: "appointments",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentModel.belongsTo(doctorModel, {
    foreignKey: {
        name: "doctorUuid",
        allowNull: false,
    },
    as: "doctor",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

clinicModel.hasMany(appointmentModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "appointments",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

appointmentModel.belongsTo(clinicModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "clinic",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

appointmentModel.hasMany(appointmentDocumentModel, {
    foreignKey: {
        name: "appointmentUuid",
        allowNull: false,
    },
    as: "documents",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentDocumentModel.belongsTo(appointmentModel, {
    foreignKey: {
        name: "appointmentUuid",
        allowNull: false,
    },
    as: "appointment",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

patientModel.hasMany(scanModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "scans",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

scanModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

scanModel.hasMany(scanImageModel, {
    foreignKey: {
        name: "scanUuid",
        allowNull: false,
    },
    as: "images",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

scanImageModel.belongsTo(scanModel, {
    foreignKey: {
        name: "scanUuid",
        allowNull: false,
    },
    as: "scan",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

export {
    appointmentModel,
    appointmentDocumentModel,
    clinicModel,
    doctorModel,
    patientModel,
    scanModel,
    scanImageModel,
};
