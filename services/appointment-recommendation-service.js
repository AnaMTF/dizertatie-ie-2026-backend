import { Op } from "sequelize";

import {
    appointmentRecommendationModel,
    patientModel,
} from "../models/index.js";
import { createError } from "../utils/error.js";
import { createNotification } from "./notification-service.js";
import { generateAppointmentRecommendations } from "./appointment-recommendation-engine/engine.js";

const DEFAULT_SOURCE = "signup";

function toPublicRecommendation(item) {
    return {
        uuid: item.uuid,
        source: item.source,
        specialty: item.specialty,
        score: item.score,
        priority: item.priority,
        rationale: item.rationale,
        reasonCodes: item.reasonCodes,
        riskSignals: item.riskSignals,
        engineVersion: item.engineVersion,
        generatedAt: item.generatedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

function buildNotificationPayload(recommendations) {
    if (!recommendations.length) {
        return null;
    }

    const firstSpecialty = recommendations[0].specialty;

    return {
        type: "system_message",
        title: "Personalized appointment recommendations",
        body: "We prepared recommendations based on your profile. You can review and book a suitable appointment.",
        data: {
            category: "appointment_recommendation",
            specialty: firstSpecialty,
            specialties: recommendations.map((item) => item.specialty),
            url: `/appointments?recommended=true&specialty=${firstSpecialty}`,
        },
    };
}

export async function refreshAppointmentRecommendationsForPatient(patient, {
    source = DEFAULT_SOURCE,
    sendNotification = false,
} = {}) {
    const generated = await generateAppointmentRecommendations(patient);
    const generatedAt = new Date();

    const specialties = generated.recommendations.map((item) => item.specialty);

    if (specialties.length) {
        await appointmentRecommendationModel.destroy({
            where: {
                patientUuid: patient.uuid,
                source,
                specialty: {
                    [Op.notIn]: specialties,
                },
            },
        });
    } else {
        await appointmentRecommendationModel.destroy({
            where: {
                patientUuid: patient.uuid,
                source,
            },
        });
    }

    for (const recommendation of generated.recommendations) {
        await appointmentRecommendationModel.upsert({
            patientUuid: patient.uuid,
            source,
            specialty: recommendation.specialty,
            score: recommendation.score,
            priority: recommendation.priority,
            rationale: recommendation.rationale,
            reasonCodes: recommendation.reasonCodes,
            riskSignals: generated.riskSignals,
            engineVersion: generated.engineVersion,
            generatedAt,
        });
    }

    if (sendNotification) {
        const payload = buildNotificationPayload(generated.recommendations);

        if (payload) {
            await createNotification({
                userId: patient.uuid,
                ...payload,
                sendPush: false,
            });
        }
    }

    return generated;
}

export async function refreshAppointmentRecommendationsFromUser(user, options = {}) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can refresh recommendations");
    }

    const patient = await patientModel.findByPk(user.uuid);

    if (!patient) {
        throw createError(404, "Patient not found");
    }

    return refreshAppointmentRecommendationsForPatient(patient, options);
}

export async function listAppointmentRecommendations(user, query = {}) {
    if (user.role !== "patient") {
        throw createError(403, "Only patients can access recommendations");
    }

    const limit = Math.min(10, Math.max(1, Number(query.limit) || 3));
    const source = query.source || null;

    const items = await appointmentRecommendationModel.findAll({
        where: {
            patientUuid: user.uuid,
            ...(source ? { source } : {}),
        },
        order: [
            ["score", "DESC"],
            ["generatedAt", "DESC"],
        ],
        limit,
    });

    return items.map(toPublicRecommendation);
}
