import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import models from "../models/index.js";

const SALT_ROUNDS = 12;

function createAuthToken(user) {
    return jwt.sign(
        {
            id: user.id,
            uuid: user.uuid,
            role: user.role,
        },
        process.env.JWT_SECRET || "dev-secret-change-me",
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        },
    );
}

function toPublicPatient(patient) {
    return {
        id: patient.id,
        uuid: patient.uuid,
        role: "patient",
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        height: patient.height,
        weight: patient.weight,
        additionalMedicalInfo: patient.additionalMedicalInfo,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
    };
}

function toPublicDoctor(doctor) {
    return {
        id: doctor.id,
        uuid: doctor.uuid,
        role: "doctor",
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        clinicId: doctor.clinicId,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
    };
}

export async function register(data) {
    const existingPatient = await models.patientModel.findOne({
        where: { email: data.email },
    });

    const existingDoctor = await models.doctorModel.findOne({
        where: { email: data.email },
    });

    if (existingPatient || existingDoctor) {
        const error = new Error("Email is already registered");
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const patient = await models.patientModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        additionalMedicalInfo: data.additionalMedicalInfo,
    });

    const user = toPublicPatient(patient);

    return {
        user,
        token: createAuthToken(user),
    };
}

export async function login(data) {
    const patient = await models.patientModel.findOne({
        where: { email: data.email },
    });

    if (patient) {
        const passwordMatches = await bcrypt.compare(data.password, patient.passwordHash);

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

    const doctor = await models.doctorModel.findOne({
        where: { email: data.email },
    });

    if (doctor) {
        const passwordMatches = await bcrypt.compare(data.password, doctor.passwordHash);

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
