import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "array",
    minItems: 1,
    maxItems: 4,
    items: {
        type: "object",
        additionalProperties: false,
        required: ["fileName", "bodyPart", "imageType"],
        properties: {
            fileName: {
                type: "string",
                minLength: 1,
                maxLength: 255,
            },
            bodyPart: {
                type: "string",
                enum: [],
            },
            imageType: {
                type: "string",
                enum: [],
            },
        },
    },
};

export const validateCreateScan = ajv.compile(schema);
