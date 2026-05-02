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
                "follow_up_reminder",
                "appointment_confirmed",
                "appointment_cancelled",
                "system_message",
            ),
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
                fields: ["patientUuid", "createdAt"],
            },
            {
                fields: ["patientUuid", "readAt"],
            },
        ],
    },
);
