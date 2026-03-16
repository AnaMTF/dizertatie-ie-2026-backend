import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["email", "password", "firstName", "lastName", "dateOfBirth", "height", "weight"],
    additionalProperties: false,
    properties: {
        email: {
            type: "string",
            format: "email"
        },
        password: {
            type: "string",
            minLength: 8,
            maxLength: 128
        },
        firstName: {
            type: "string",
            minLength: 1,
            maxLength: 100
        },
        lastName: {
            type: "string",
            minLength: 1,
            maxLength: 100
        },
        dateOfBirth: {
            type: "string",
            format: "date"
        },
        height: {
            type: "number",
            minimum: 0
        },
        weight: {
            type: "number",
            minimum: 0
        },
        additionalMedicalInfo: {
            type: "string"
        }
    }
};

export const validateCreatePatient = ajv.compile(schema);
