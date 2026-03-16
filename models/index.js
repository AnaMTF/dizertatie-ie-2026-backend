import { appointmentModel } from "./appointment-model.js";
import { clinicModel } from "./clinic-model.js";
import { doctorModel } from "./doctor-model.js";
import { patientModel } from "./patient-model.js";

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

export { appointmentModel, clinicModel, doctorModel, patientModel };
