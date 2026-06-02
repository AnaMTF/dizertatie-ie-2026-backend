import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const notificationModel = database.define(
    "Notification",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(
                "scan_results_ready",
                "scan_verified_accurate",
                "scan_verified_inaccurate",
                "follow_up_reminder",
                "appointment_confirmed",
                "appointment_cancelled",
                "doctor_new_appointment",
                "doctor_appointment_rescheduled",
                "doctor_appointment_cancelled",
                "system_message",
            ),
            allowNull: false,
        },
        recipientRole: {
            type: DataTypes.ENUM("patient", "doctor"),
            allowNull: false,
            defaultValue: "patient",
        },
        recipientUuid: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "medium",
            validate: {
                isIn: [["low", "medium", "high"]],
            },
        },
        data: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        paranoid: true,
        indexes: [
            {
                fields: ["recipientRole", "recipientUuid", "createdAt"],
            },
            {
                fields: ["recipientRole", "recipientUuid", "readAt"],
            },
            {
                fields: ["patientUuid", "createdAt"],
            },
            {
                fields: ["patientUuid", "readAt"],
            },
        ],
    },
);
