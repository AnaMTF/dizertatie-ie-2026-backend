import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
    type: "object",
    additionalProperties: false,
    properties: {},
};

export const validateVerifyScan = ajv.compile(schema);
