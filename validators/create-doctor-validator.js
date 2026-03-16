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
        "specialization",
        "clinicId",
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
        specialization: {
            type: "string",
            minLength: 1,
            maxLength: 100,
        },
        clinicId: {
            type: "integer",
        },
    },
};

export const validateCreateDoctor = ajv.compile(schema);
