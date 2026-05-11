import { Op } from "sequelize";

import {
    appointmentRecommendationModel,
    notificationModel,
    patientModel,
} from "../models/index.js";
import { createError } from "../utils/error.js";
import { createNotification } from "./notification-service.js";
import { generateAppointmentRecommendations } from "./appointment-recommendation-engine/engine.js";

const DEFAULT_SOURCE = "signup";
const DEFAULT_NOTIFICATION_DEDUPLICATION_MINUTES = 120;

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

function toSpecialtyLabel(value) {
    return String(value)
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function buildNotificationPayloadForRecommendation(recommendation, source) {
    const specialtyLabel = toSpecialtyLabel(recommendation.specialty);

    return {
        type: "system_message",
        title: `Suggested appointment: ${specialtyLabel}`,
        body: `Based on your profile, ${specialtyLabel} is recommended. Tap to book now.`,
        data: {
            category: "appointment_recommendation",
            source,
            specialty: recommendation.specialty,
            score: recommendation.score,
            priority: recommendation.priority,
            url: `/appointments?create=true&recommended=true&specialty=${encodeURIComponent(recommendation.specialty)}`,
        },
    };
}

function getNotificationDedupeMinutes(source) {
    if (source === "signup") {
        return 0;
    }

    const configured = Number(
        process.env.APPOINTMENT_RECOMMENDATION_NOTIFICATION_DEDUPE_MINUTES,
    );

    if (!Number.isFinite(configured) || configured < 0) {
        return DEFAULT_NOTIFICATION_DEDUPLICATION_MINUTES;
    }

    return configured;
}

async function listRecentlyNotifiedSpecialties(patientUuid, source) {
    const dedupeMinutes = getNotificationDedupeMinutes(source);

    if (dedupeMinutes === 0) {
        return new Set();
    }

    const since = new Date(Date.now() - dedupeMinutes * 60 * 1000);
    const existing = await notificationModel.findAll({
        where: {
            patientUuid,
            type: "system_message",
            createdAt: {
                [Op.gte]: since,
            },
        },
        attributes: ["data"],
    });

    const specialties = new Set();

    for (const notification of existing) {
        if (notification.data?.category !== "appointment_recommendation") {
            continue;
        }

        if (notification.data?.source !== source) {
            continue;
        }

        if (typeof notification.data?.specialty === "string") {
            specialties.add(notification.data.specialty);
        }
    }

    return specialties;
}

export async function refreshAppointmentRecommendationsForPatient(
    patient,
    { source = DEFAULT_SOURCE, sendNotification = false } = {},
) {
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
        const recentlyNotifiedSpecialties =
            await listRecentlyNotifiedSpecialties(patient.uuid, source);

        for (const recommendation of generated.recommendations) {
            if (recentlyNotifiedSpecialties.has(recommendation.specialty)) {
                continue;
            }

            const payload = buildNotificationPayloadForRecommendation(
                recommendation,
                source,
            );

            await createNotification({
                userId: patient.uuid,
                ...payload,
                sendPush: false,
            });

            recentlyNotifiedSpecialties.add(recommendation.specialty);
        }
    }

    return generated;
}

export async function refreshAppointmentRecommendationsFromUser(
    user,
    options = {},
) {
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
