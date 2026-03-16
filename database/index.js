import { Sequelize } from "sequelize";

const database = new Sequelize({
    dialect: process.env.DIALECT || "sqlite",
    storage: process.env.DATABASE || "./database.sqlite",
});

export default database;
