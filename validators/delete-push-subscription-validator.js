import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
    type: "object",
    required: ["endpoint"],
    additionalProperties: false,
    properties: {
        endpoint: {
            type: "string",
            minLength: 1,
        },
    },
};

export const validateDeletePushSubscription = ajv.compile(schema);
