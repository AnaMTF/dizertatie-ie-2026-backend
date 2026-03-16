import { DataTypes } from "sequelize";

import database from "../database/index.js";

const clinicModel = database.define("Clinic", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

export default clinicModel;