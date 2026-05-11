import * as tf from "@tensorflow/tfjs";
import * as useModel from "@tensorflow-models/universal-sentence-encoder";

import { medicalSpecialties } from "../../config/medical-specialties.js";

const DEFAULT_SIMILARITY_THRESHOLD = 0.58;
const DEFAULT_MAX_RESULTS = 3;

let embeddingModelPromise = null;
let tfReadyPromise = null;

async function ensureTfReady() {
    if (!tfReadyPromise) {
        tfReadyPromise = (async () => {
            await tf.setBackend("cpu");
            await tf.ready();
        })().catch((error) => {
            tfReadyPromise = null;
            throw error;
        });
    }

    return tfReadyPromise;
}

function parsePositiveNumber(value, fallback) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
}

function toHumanLabel(value) {
    if (!value) {
        return "Unknown";
    }

    return String(value)
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function mapAlcoholFrequency(value) {
    const labels = {
        never: "never",
        less_than_monthly: "less than monthly",
        monthly: "monthly",
        weekly: "weekly",
        daily_or_almost_daily: "daily or almost daily",
    };

    return labels[value] || "unknown";
}

function createPatientNarrative(profile) {
    const sections = [];

    if (profile.sex) {
        sections.push(`Sex: ${profile.sex}.`);
    }

    if (Number.isFinite(profile?.metrics?.ageYears)) {
        sections.push(`Age: ${profile.metrics.ageYears} years.`);
    }

    if (Number.isFinite(profile?.metrics?.bmi)) {
        sections.push(`Body mass index: ${profile.metrics.bmi}.`);
    }

    if (Number.isFinite(Number(profile.height))) {
        sections.push(`Height: ${Number(profile.height)} cm.`);
    }

    if (Number.isFinite(Number(profile.weight))) {
        sections.push(`Weight: ${Number(profile.weight)} kg.`);
    }

    if (typeof profile.smoker === "boolean") {
        sections.push(
            `Smoking status: ${profile.smoker ? "smoker" : "non-smoker"}.`,
        );
    }

    if (profile.alcoholConsumptionFrequency) {
        sections.push(
            `Alcohol consumption frequency: ${mapAlcoholFrequency(profile.alcoholConsumptionFrequency)}.`,
        );
    }

    if (profile.additionalMedicalInfo) {
        sections.push(
            `Additional medical notes: ${String(profile.additionalMedicalInfo).trim()}.`,
        );
    }

    if (sections.length === 0) {
        return "Patient profile has limited data. Recommend conservative preventive care specialty guidance.";
    }

    return sections.join(" ");
}

function buildSpecialtyPrompts() {
    return medicalSpecialties.map((specialty) => ({
        specialty,
        prompt: `Patient likely needs a consultation in ${toHumanLabel(specialty)} based on profile risk factors and lifestyle context.`,
    }));
}

function cosineSimilarity(left, right) {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;

    for (let index = 0; index < left.length; index += 1) {
        const leftValue = Number(left[index]) || 0;
        const rightValue = Number(right[index]) || 0;

        dot += leftValue * rightValue;
        leftNorm += leftValue * leftValue;
        rightNorm += rightValue * rightValue;
    }

    if (leftNorm === 0 || rightNorm === 0) {
        return 0;
    }

    return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function normalizeSimilarityScore(value) {
    return Math.max(0, Math.min(1, (value + 1) / 2));
}

function buildReasonCodes(profile) {
    const reasonCodes = ["tfjs_zero_shot_similarity"];

    if (typeof profile.smoker === "boolean") {
        reasonCodes.push(profile.smoker ? "smoker_yes" : "smoker_no");
    }

    if (profile.alcoholConsumptionFrequency) {
        reasonCodes.push(`alcohol_${profile.alcoholConsumptionFrequency}`);
    }

    if (Number.isFinite(profile?.metrics?.ageYears)) {
        reasonCodes.push("age_available");
    }

    if (Number.isFinite(profile?.metrics?.bmi)) {
        reasonCodes.push("bmi_available");
    }

    return reasonCodes;
}

async function getEmbeddingModel() {
    await ensureTfReady();

    if (!embeddingModelPromise) {
        embeddingModelPromise = useModel.load().catch((error) => {
            embeddingModelPromise = null;
            throw error;
        });
    }

    return embeddingModelPromise;
}

export function createTfjsZeroShotRiskInferenceProvider() {
    return {
        name: "tfjs_zero_shot_use",
        async infer(profile) {
            const similarityThreshold = parsePositiveNumber(
                process.env.APPOINTMENT_TFJS_SIMILARITY_THRESHOLD,
                DEFAULT_SIMILARITY_THRESHOLD,
            );
            const maxResults = Math.min(
                5,
                Math.max(
                    1,
                    Math.trunc(
                        parsePositiveNumber(
                            process.env.APPOINTMENT_TFJS_MAX_RECOMMENDATIONS,
                            DEFAULT_MAX_RESULTS,
                        ),
                    ),
                ),
            );

            try {
                const model = await getEmbeddingModel();
                const narrative = createPatientNarrative(profile);
                const specialtyPrompts = buildSpecialtyPrompts();

                const embeddingTensor = await model.embed([
                    narrative,
                    ...specialtyPrompts.map((item) => item.prompt),
                ]);

                const vectors = await embeddingTensor.array();
                embeddingTensor.dispose();

                const [profileVector, ...specialtyVectors] = vectors;

                const scored = specialtyPrompts
                    .map((item, index) => {
                        const similarity = cosineSimilarity(
                            profileVector,
                            specialtyVectors[index],
                        );
                        const score = normalizeSimilarityScore(similarity);

                        return {
                            specialty: item.specialty,
                            score,
                        };
                    })
                    .filter((item) => item.score >= similarityThreshold)
                    .sort((left, right) => right.score - left.score)
                    .slice(0, maxResults)
                    .map((item) => ({
                        specialty: item.specialty,
                        score: Number(item.score.toFixed(3)),
                        rationale:
                            "TensorFlow.js zero-shot profile matching indicated this specialization as relevant.",
                        reasonCodes: buildReasonCodes(profile),
                    }));

                const topScore = scored.length ? scored[0].score : null;

                return {
                    signals: {
                        tfjsSimilarityThreshold: similarityThreshold,
                        tfjsCandidates: scored.length,
                        tfjsTopScore: topScore,
                    },
                    recommendations: scored,
                };
            } catch (error) {
                console.error(
                    "TFJS zero-shot recommendation provider failed, falling back to rule-only recommendations.",
                    error,
                );

                return {
                    signals: {
                        tfjsProviderError: true,
                    },
                    recommendations: [],
                };
            }
        },
    };
}
