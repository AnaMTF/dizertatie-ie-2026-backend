import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 200,
        },
        address: {
            type: "string",
            minLength: 1,
            maxLength: 500,
        },
    },
};

export const validateUpdateClinic = ajv.compile(schema);
