import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["fullName", "email", "phone", "subject", "message"],
    additionalProperties: false,
    properties: {
        fullName: {
            type: "string",
            minLength: 1,
            maxLength: 150,
        },
        email: {
            type: "string",
            format: "email",
            maxLength: 254,
        },
        phone: {
            type: "string",
            minLength: 1,
            maxLength: 30,
        },
        subject: {
            type: "string",
            minLength: 1,
            maxLength: 200,
        },
        message: {
            type: "string",
            minLength: 1,
            maxLength: 2000,
        },
    },
};

export const validateContactSubmission = ajv.compile(schema);
