import { DataTypes } from "sequelize";
import database from "../database/index.js";

export const postEmbeddingModel = database.define(
    "PostEmbedding",
    {
        slug: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        embedding: {
            type: DataTypes.VECTOR(384),
            allowNull: false,
        },
    },
    {
        timestamps: false,
    },
);
