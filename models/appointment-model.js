import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const appointmentModel = database.define("Appointment", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timeSlot: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM(
            "scheduled",
            "confirmed",
            "cancelled",
            "rescheduled",
            "completed",
        ),
        allowNull: false,
        defaultValue: "scheduled",
    },
    cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    doctorDiagnosis: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    doctorPrescription: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    doctorFollowUpRecommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    doctorFollowUpDate: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    doctorResultsUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
});
