import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["email"],
    additionalProperties: false,
    properties: {
        email: {
            type: "string",
            format: "email",
        },
    },
};

export const validateEmailLookup = ajv.compile(schema);
