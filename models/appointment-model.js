import { DataTypes } from "sequelize";

import database from "../database/index.js";

const appointmentModel = database.define("Appointment", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("scheduled", "cancelled", "rescheduled"),
        allowNull: false,
        defaultValue: "scheduled",
    },
    cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});

export default appointmentModel;