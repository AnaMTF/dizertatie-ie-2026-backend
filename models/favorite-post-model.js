import { DataTypes } from "sequelize";

import database from "../database/index.js";

export const favoritePostModel = database.define(
    "FavoritePost",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        recipientRole: {
            type: DataTypes.ENUM("patient", "doctor"),
            allowNull: false,
        },
        recipientUuid: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        postSlug: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: "PostEmbeddings",
                key: "slug",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
    },
    {
        updatedAt: false,
        indexes: [
            {
                fields: ["recipientRole", "recipientUuid"],
            },
            {
                unique: true,
                fields: ["recipientRole", "recipientUuid", "postSlug"],
            },
        ],
    },
);
