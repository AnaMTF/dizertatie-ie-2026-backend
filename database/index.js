import { Sequelize } from "sequelize";

const database = new Sequelize({
    dialect: process.env.DIALECT,
    storage: process.env.DATABASE,
});

export default database;
