import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const scanModel = database.define("Scan", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("processing", "completed", "failed"),
        allowNull: false,
        defaultValue: "processing",
    },
    bodyPart: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imageType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    results: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    verificationVerdict: {
        type: DataTypes.ENUM("pending", "accurate", "inaccurate"),
        allowNull: false,
        defaultValue: "pending",
    },
    verifiedByDoctorUuid: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
});
