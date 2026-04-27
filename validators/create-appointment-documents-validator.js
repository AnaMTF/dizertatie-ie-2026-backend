import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
    type: "array",
    minItems: 1,
    maxItems: 5,
    items: {
        type: "object",
        additionalProperties: false,
        properties: {
            fileName: {
                type: "string",
                minLength: 1,
                maxLength: 255,
            },
        },
    },
};

export const validateCreateAppointmentDocuments = ajv.compile(schema);
