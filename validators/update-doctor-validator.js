import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    minProperties: 1,
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
        specialization: {
            type: "string",
            minLength: 1,
            maxLength: 100,
        },
        clinicUuid: {
            type: "string",
            format: "uuid",
        },
    },
};

export const validateUpdateDoctor = ajv.compile(schema);
