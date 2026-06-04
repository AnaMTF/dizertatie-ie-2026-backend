import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const followUpReminderModel = database.define(
    "FollowUpReminder",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        reminderType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sentAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        appointmentUuid: {
            type: DataTypes.UUID,
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
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["patientUuid", "appointmentUuid", "reminderType"],
            },
        ],
    },
);
