import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: [
        "email",
        "password",
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
        password: {
            type: "string",
            minLength: 8,
            maxLength: 128,
            allOf: [
                { pattern: ".*[A-Z].*" }, // contains at least one uppercase letter
                { pattern: ".*[a-z].*" }, // contains at least one lowercase letter
                { pattern: ".*[0-9].*" }, // contains at least one digit
                { pattern: ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*" }, // contains at least one special character
            ],
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

export const validateRegister = ajv.compile(schema);
