import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const scanImageModel = database.define("ScanImage", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "application/octet-stream",
    },
});
