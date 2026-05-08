import { Sequelize } from "sequelize";

const DIALECT = process.env.DIALECT || "sqlite";

const database =
    DIALECT === "postgres"
        ? new Sequelize({
              dialect: "postgres",
              host: process.env.DB_HOST || "localhost",
              port: Number(process.env.DB_PORT || 5432),
              database: process.env.DB_NAME || "postgres",
              username: process.env.DB_USER || "postgres",
              password: process.env.DB_PASSWORD || "",
          })
        : new Sequelize({
              dialect: "sqlite",
              storage: process.env.DATABASE || "./dizertatie.db",
          });

export default database;
