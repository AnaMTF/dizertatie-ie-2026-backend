import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const pushDeliveryLogModel = database.define(
    "PushDeliveryLog",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        subscriptionEndpoint: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        attemptNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        statusCode: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        succeeded: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        updatedAt: false,
        indexes: [{ fields: ["notificationUuid"] }],
    },
);
