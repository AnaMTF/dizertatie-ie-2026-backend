import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["name", "address"],
    additionalProperties: false,
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 200
        },
        address: {
            type: "string",
            minLength: 1,
            maxLength: 500
        }
    }
};

export const validateCreateClinic = ajv.compile(schema);
