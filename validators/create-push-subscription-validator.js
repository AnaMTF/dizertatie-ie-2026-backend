import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
    type: "object",
    required: ["endpoint", "keys"],
    additionalProperties: false,
    properties: {
        endpoint: {
            type: "string",
            minLength: 1,
        },
        keys: {
            type: "object",
            required: ["p256dh", "auth"],
            additionalProperties: false,
            properties: {
                p256dh: {
                    type: "string",
                    minLength: 1,
                },
                auth: {
                    type: "string",
                    minLength: 1,
                },
            },
        },
    },
};

export const validateCreatePushSubscription = ajv.compile(schema);
