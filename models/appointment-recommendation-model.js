import { DataTypes } from "sequelize";

import database from "../database/index.js";
import { medicalSpecialties } from "../config/medical-specialties.js";

export const appointmentRecommendationModel = database.define(
    "AppointmentRecommendation",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [["signup", "profile_update", "manual_refresh"]],
            },
        },
        specialty: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [medicalSpecialties],
            },
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [["low", "medium", "high"]],
            },
        },
        rationale: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        reasonCodes: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        riskSignals: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        engineVersion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        generatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["patientUuid", "source", "specialty"],
            },
            {
                fields: ["patientUuid", "generatedAt"],
            },
        ],
    },
);
