import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const pushDeliveryQueueModel = database.define(
    "PushDeliveryQueue",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        payload: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        attemptCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        lastAttemptAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        nextRetryAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pending", "terminal"),
            allowNull: false,
            defaultValue: "pending",
        },
    },
    {
        indexes: [
            { fields: ["status", "nextRetryAt"] },
            { fields: ["notificationUuid"] },
            { fields: ["subscriptionUuid"] },
        ],
    },
);
