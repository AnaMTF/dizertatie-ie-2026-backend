function createNoopRiskInferenceProvider() {
    return {
        name: "none",
        async infer() {
            return {
                signals: {},
                recommendations: [],
            };
        },
    };
}

// Keep provider selection centralized so future model-backed providers can be
// added without touching the recommendation orchestration flow.
export function createRiskInferenceProvider() {
    const providerName =
        process.env.APPOINTMENT_RISK_INFERENCE_PROVIDER || "none";

    if (providerName !== "none") {
        console.warn(
            `Unknown APPOINTMENT_RISK_INFERENCE_PROVIDER '${providerName}', using 'none'`,
        );
    }

    return createNoopRiskInferenceProvider();
}
