import { DataTypes } from "sequelize";

import database from "../database/index.js";
import { medicalSpecialties } from "../config/medical-specialties.js";

export const doctorModel = database.define("Doctor", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    specialization: {
        type: DataTypes.ENUM(...medicalSpecialties),
        allowNull: false,
    },
});
