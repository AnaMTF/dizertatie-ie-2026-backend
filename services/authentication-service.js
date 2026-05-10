import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { doctorModel, patientModel } from "../models/index.js";
import { refreshAppointmentRecommendationsForPatient } from "./appointment-recommendation-service.js";

const SALT_ROUNDS = 12;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

function createAuthToken(user) {
    return jwt.sign(
        {
            uuid: user.uuid,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        },
    );
}

function toPublicPatient(patient) {
    return {
        uuid: patient.uuid,
        role: "patient",
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        height: patient.height,
        weight: patient.weight,
        additionalMedicalInfo: patient.additionalMedicalInfo,
        smoker: patient.smoker,
        alcoholConsumptionFrequency: patient.alcoholConsumptionFrequency,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
    };
}

function toPublicDoctor(doctor) {
    return {
        uuid: doctor.uuid,
        role: "doctor",
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        clinicUuid: doctor.clinicUuid,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
    };
}

export async function register(data) {
    const existingPatient = await patientModel.findOne({
        where: { email: data.email },
    });

    const existingDoctor = await doctorModel.findOne({
        where: { email: data.email },
    });

    if (existingPatient || existingDoctor) {
        const error = new Error("Email is already registered");
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const patient = await patientModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        sex: data.sex,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        additionalMedicalInfo: data.additionalMedicalInfo,
        smoker: data.smoker,
        alcoholConsumptionFrequency: data.alcoholConsumptionFrequency,
    });

    try {
        await refreshAppointmentRecommendationsForPatient(patient, {
            source: "signup",
            sendNotification: true,
        });
    } catch (error) {
        console.error(
            "Failed to generate signup appointment recommendations",
            error,
        );
    }

    const user = toPublicPatient(patient);

    return {
        user,
        token: createAuthToken(user),
    };
}

export async function login(data) {
    const patient = await patientModel.findOne({
        where: { email: data.email },
    });

    if (patient) {
        const passwordMatches = await bcrypt.compare(
            data.password,
            patient.passwordHash,
        );

        if (!passwordMatches) {
            const error = new Error("Invalid email or password");
            error.status = 401;
            throw error;
        }

        const user = toPublicPatient(patient);

        return {
            user,
            token: createAuthToken(user),
        };
    }

    const doctor = await doctorModel.findOne({
        where: { email: data.email },
    });

    if (doctor) {
        const passwordMatches = await bcrypt.compare(
            data.password,
            doctor.passwordHash,
        );

        if (!passwordMatches) {
            const error = new Error("Invalid email or password");
            error.status = 401;
            throw error;
        }

        const user = toPublicDoctor(doctor);

        return {
            user,
            token: createAuthToken(user),
        };
    }

    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
}

export async function lookupEmail(data) {
    const patient = await patientModel.findOne({
        where: { email: data.email },
    });

    if (patient) {
        return {
            exists: true,
            role: "patient",
        };
    }

    const doctor = await doctorModel.findOne({
        where: { email: data.email },
    });

    if (doctor) {
        return {
            exists: true,
            role: "doctor",
        };
    }

    return {
        exists: false,
    };
}
