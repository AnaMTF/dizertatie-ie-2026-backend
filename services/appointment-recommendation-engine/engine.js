import { medicalSpecialties } from "../../config/medical-specialties.js";
import { calculateAgeYears, calculateBmi } from "./profile-metrics.js";
import { createRiskInferenceProvider } from "./risk-inference-provider.js";
import { runAgeBmiRules } from "./rules/age-bmi-rules.js";

const ENGINE_VERSION = "age-bmi-rules-v1";
const MAX_RECOMMENDATIONS = 3;

function toPriority(score) {
    if (score >= 0.85) {
        return "high";
    }

    if (score >= 0.7) {
        return "medium";
    }

    return "low";
}

function mergeCandidates(candidates) {
    const bySpecialty = new Map();

    for (const candidate of candidates) {
        if (!medicalSpecialties.includes(candidate.specialty)) {
            continue;
        }

        const existing = bySpecialty.get(candidate.specialty);

        if (!existing || candidate.score > existing.score) {
            bySpecialty.set(candidate.specialty, {
                ...candidate,
                reasonCodes: [...new Set(candidate.reasonCodes || [])],
            });
            continue;
        }

        existing.reasonCodes = [
            ...new Set([
                ...(existing.reasonCodes || []),
                ...(candidate.reasonCodes || []),
            ]),
        ];
    }

    return [...bySpecialty.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RECOMMENDATIONS)
        .map((item) => ({
            ...item,
            priority: toPriority(item.score),
        }));
}

export async function generateAppointmentRecommendations(patientProfile) {
    const ageYears = calculateAgeYears(patientProfile.dateOfBirth);
    const bmi = calculateBmi(patientProfile.height, patientProfile.weight);

    const metrics = {
        ageYears,
        bmi,
    };

    const provider = createRiskInferenceProvider();
    const inferred = await provider.infer({
        ...patientProfile,
        metrics,
    });

    const ruleCandidates = runAgeBmiRules(metrics);
    const providerCandidates = Array.isArray(inferred?.recommendations)
        ? inferred.recommendations
        : [];

    const recommendations = mergeCandidates([
        ...ruleCandidates,
        ...providerCandidates,
    ]);

    return {
        engineVersion: ENGINE_VERSION,
        provider: provider.name,
        riskSignals: {
            ageYears,
            bmi,
            ...(inferred?.signals || {}),
        },
        recommendations,
    };
}
