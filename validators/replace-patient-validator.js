import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: [
        "email",
        "firstName",
        "lastName",
        "sex",
        "dateOfBirth",
        "height",
        "weight",
    ],
    additionalProperties: false,
    properties: {
        email: {
            type: "string",
            format: "email",
        },
        firstName: {
            type: "string",
            minLength: 1,
            maxLength: 100,
        },
        lastName: {
            type: "string",
            minLength: 1,
            maxLength: 100,
        },
        sex: {
            type: "string",
            enum: ["Man", "Woman"],
        },
        dateOfBirth: {
            type: "string",
            format: "date",
        },
        height: {
            type: "number",
            minimum: 0,
        },
        weight: {
            type: "number",
            minimum: 0,
        },
        additionalMedicalInfo: {
            type: "string",
        },
        smoker: {
            type: "boolean",
        },
        alcoholConsumptionFrequency: {
            type: "string",
            enum: [
                "never",
                "less_than_monthly",
                "monthly",
                "weekly",
                "daily_or_almost_daily",
            ],
        },
    },
};

export const validateReplacePatient = ajv.compile(schema);
