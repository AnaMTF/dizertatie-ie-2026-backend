import { DataTypes } from "sequelize";

import database from "../database/index.js";

const patientModel = database.define("Patient", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
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
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    height: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    additionalMedicalInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
});

export default patientModel;