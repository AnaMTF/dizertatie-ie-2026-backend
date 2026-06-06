import { medicalSpecialties } from "../../config/medical-specialties.js";
import { calculateAgeYears, calculateBmi } from "./profile-metrics.js";
import { createRiskInferenceProvider } from "./risk-inference-provider.js";
import { runAgeBmiRules } from "./rules/age-bmi-rules.js";

const ENGINE_VERSION = "age-bmi-rules-v1";
const MAX_RECOMMENDATIONS = 3;

const LIFESTYLE_SEVERITY_BOOST_THRESHOLD = 0.6;

function toHumanLabel(value) {
    return String(value)
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function normalizeRecommendation(item) {
    const hasRationale =
        typeof item.rationale === "string" && item.rationale.trim().length > 0;

    const fallbackRationale = hasRationale
        ? item.rationale
        : `Recommendation for ${toHumanLabel(item.specialty)} based on profile-derived risk signals (score ${Number(item.score).toFixed(3)}).`;

    const reasonCodes = [...new Set(item.reasonCodes || [])];

    if (!hasRationale && !reasonCodes.includes("rationale_fallback")) {
        reasonCodes.push("rationale_fallback");
    }

    return {
        ...item,
        rationale: fallbackRationale,
        reasonCodes,
    };
}

function toPriority(score, lifestyleRiskSeverity = 0) {
    let level = 0;

    if (score >= 0.85) {
        level = 2;
    } else if (score >= 0.7) {
        level = 1;
    }

    if (lifestyleRiskSeverity >= LIFESTYLE_SEVERITY_BOOST_THRESHOLD) {
        level = Math.min(2, level + 1);
    }

    if (level === 2) {
        return "high";
    }

    if (level === 1) {
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
        .map(normalizeRecommendation)
        .map((item) => ({
            ...item,
            priority: toPriority(item.score, item.lifestyleRiskSeverity ?? 0),
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
