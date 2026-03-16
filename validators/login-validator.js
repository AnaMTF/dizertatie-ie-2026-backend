import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["email", "password"],
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
        }
    }
};

export const validateLogin = ajv.compile(schema);