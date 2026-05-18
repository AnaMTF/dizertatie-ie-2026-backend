import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const pushSubscriptionModel = database.define(
    "PushSubscription",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        endpoint: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
        },
        p256dh: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        auth: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        userAgent: {
            type: DataTypes.STRING,
            allowNull: true,
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
    },
    {
        indexes: [
            {
                fields: ["recipientRole", "recipientUuid"],
            },
            {
                fields: ["patientUuid"],
            },
        ],
    },
);
