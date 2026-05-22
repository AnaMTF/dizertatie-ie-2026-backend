import nodemailer from "nodemailer";

import { createError } from "../utils/error.js";

const SMTP_SERVICE = process.env.SMTP_SERVICE;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL;

let transporter = null;

function ensureTransporter() {
    if (transporter) {
        return transporter;
    }

    if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
        throw createError(500, "SMTP is not configured on the backend");
    }

    if (!SMTP_SERVICE && !SMTP_HOST) {
        throw createError(500, "SMTP host or service is not configured");
    }

    const transportConfig = {
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    };

    if (SMTP_SERVICE) {
        transportConfig.service = SMTP_SERVICE;
    } else {
        if (!Number.isFinite(SMTP_PORT) || SMTP_PORT <= 0) {
            throw createError(500, "SMTP_PORT is invalid");
        }

        transportConfig.host = SMTP_HOST;
        transportConfig.port = SMTP_PORT;
        transportConfig.secure = SMTP_SECURE;
    }

    transporter = nodemailer.createTransport(transportConfig);

    return transporter;
}

export function getSmtpFromEmail() {
    if (!SMTP_FROM_EMAIL) {
        throw createError(500, "SMTP_FROM_EMAIL is not configured");
    }

    return SMTP_FROM_EMAIL;
}

export async function sendEmail(options) {
    const activeTransporter = ensureTransporter();

    return activeTransporter.sendMail(options);
}
