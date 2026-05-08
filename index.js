import "dotenv/config";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { DataTypes } from "sequelize";

import database from "./database/index.js";
import "./models/index.js";
import {
    consumeScanResults,
    closeRabbitMq,
} from "./services/rabbitmq-service.js";
import { applyScanResult } from "./services/scan-result-service.js";
import {
    appointmentRouter,
    appointmentRecommendationRouter,
    authenticationRouter,
    clinicRouter,
    doctorRouter,
    notificationRouter,
    patientRouter,
    pushRouter,
    scanRouter,
} from "./routers/index.js";
import { startSchedulers } from "./services/scheduler-service.js";

const app = express();
const PORT = process.env.PORT || 9000;
const readHeavyEndpoints = new Set([
    "/api/v1/scan",
    "/api/v1/scan/options",
    "/api/v1/notifications/unread-count",
]);

function isReadHeavyRequest(request) {
    return request.method === "GET" && readHeavyEndpoints.has(request.path);
}

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    skip: isReadHeavyRequest,
});

const readHeavyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    skip: (request) => !isReadHeavyRequest(request),
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
});

app.use("/api/v1/auth", authLimiter, authenticationRouter);
app.use(generalLimiter);
app.use(readHeavyLimiter);

app.use("/api/v1", appointmentRecommendationRouter);
app.use("/api/v1", appointmentRouter);
app.use("/api/v1", clinicRouter);
app.use("/api/v1", doctorRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", patientRouter);
app.use("/api/v1", pushRouter);
app.use("/api/v1", scanRouter);

async function ensureAppointmentConsultationColumns() {
    const queryInterface = database.getQueryInterface();
    const table = await queryInterface
        .describeTable("Appointments")
        .catch(() => null);

    if (!table) {
        return;
    }

    if (!table.doctorDiagnosis) {
        await queryInterface.addColumn("Appointments", "doctorDiagnosis", {
            type: DataTypes.TEXT,
            allowNull: true,
        });
    }

    if (!table.doctorPrescription) {
        await queryInterface.addColumn(
            "Appointments",
            "doctorPrescription",
            {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        );
    }

    if (!table.doctorFollowUpRecommendation) {
        await queryInterface.addColumn(
            "Appointments",
            "doctorFollowUpRecommendation",
            {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        );
    }

    if (!table.doctorFollowUpDate) {
        await queryInterface.addColumn("Appointments", "doctorFollowUpDate", {
            type: DataTypes.STRING,
            allowNull: true,
        });
    }

    if (!table.doctorResultsUpdatedAt) {
        await queryInterface.addColumn(
            "Appointments",
            "doctorResultsUpdatedAt",
            {
                type: DataTypes.DATE,
                allowNull: true,
            },
        );
    }
}

async function start() {
    await database.authenticate();
    await database.sync();
    await ensureAppointmentConsultationColumns();
    await consumeScanResults(applyScanResult);
    startSchedulers();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

async function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down...`);

    await closeRabbitMq().catch((error) => {
        console.error("Failed to close RabbitMQ cleanly", error);
    });

    await database.close().catch((error) => {
        console.error("Failed to close database cleanly", error);
    });

    process.exit(0);
}

process.on("SIGINT", () => {
    shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    shutdown("SIGTERM");
});

start().catch((error) => {
    console.error("Failed to start backend", error);
    process.exit(1);
});
