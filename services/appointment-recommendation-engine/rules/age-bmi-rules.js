function createRecommendation({ specialty, score, rationale, reasonCodes }) {
    return {
        specialty,
        score,
        rationale,
        reasonCodes,
    };
}

function evaluateObesityAndAgeRule({ ageYears, bmi }) {
    if (ageYears === null || bmi === null) {
        return [];
    }

    if (ageYears >= 35 && bmi >= 30) {
        return [
            createRecommendation({
                specialty: "endocrinology",
                score: 0.9,
                rationale:
                    "Age and BMI pattern suggests a metabolic health check could be useful.",
                reasonCodes: ["age_ge_35", "bmi_ge_30"],
            }),
            createRecommendation({
                specialty: "cardiology",
                score: 0.8,
                rationale:
                    "Age and BMI pattern suggests a cardiovascular risk screening could be useful.",
                reasonCodes: ["age_ge_35", "bmi_ge_30"],
            }),
        ];
    }

    return [];
}

function evaluateElevatedBmiRule({ ageYears, bmi }) {
    if (ageYears === null || bmi === null) {
        return [];
    }

    if (ageYears >= 40 && bmi >= 25) {
        return [
            createRecommendation({
                specialty: "cardiology",
                score: 0.74,
                rationale:
                    "A preventive cardiovascular assessment may be appropriate for this age/BMI profile.",
                reasonCodes: ["age_ge_40", "bmi_ge_25"],
            }),
        ];
    }

    return [];
}

function evaluateLowBmiRule({ bmi }) {
    if (bmi === null) {
        return [];
    }

    if (bmi < 18.5) {
        return [
            createRecommendation({
                specialty: "general",
                score: 0.68,
                rationale:
                    "A general check-up may help assess low body-mass profile factors.",
                reasonCodes: ["bmi_lt_18_5"],
            }),
        ];
    }

    return [];
}

const ageBmiRuleEvaluators = [
    evaluateObesityAndAgeRule,
    evaluateElevatedBmiRule,
    evaluateLowBmiRule,
];

export function runAgeBmiRules(metrics) {
    return ageBmiRuleEvaluators.flatMap((rule) => rule(metrics));
}
