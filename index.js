import "dotenv/config";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import database from "./database/index.js";
import "./models/index.js";
import {
    appointmentRouter,
    authenticationRouter,
    clinicRouter,
    doctorRouter,
    patientRouter,
    scanRouter,
} from "./routers/index.js";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
});

app.use(generalLimiter);

app.use("/api/v1", appointmentRouter);
app.use("/api/v1", clinicRouter);
app.use("/api/v1", doctorRouter);
app.use("/api/v1", patientRouter);
app.use("/api/v1", scanRouter);

app.use("/auth", authLimiter, authenticationRouter);

async function start() {
    await database.authenticate();
    await database.sync();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

start().catch((error) => {
    console.error("Failed to start backend", error);
    process.exit(1);
});
