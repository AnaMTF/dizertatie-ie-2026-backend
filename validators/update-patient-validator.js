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
            format: "email"
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

const validate = ajv.compile(schema);

export default validate;
