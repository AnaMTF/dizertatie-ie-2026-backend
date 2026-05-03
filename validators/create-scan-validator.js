import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
    supportedScanBodyParts,
    supportedScanImageTypes,
    supportedScanPairs,
} from "../config/supported-scan-options.js";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    additionalProperties: false,
    required: ["bodyPart", "imageType"],
    properties: {
        bodyPart: {
            type: "string",
            enum: supportedScanBodyParts,
        },
        imageType: {
            type: "string",
            enum: supportedScanImageTypes,
        },
    },
    anyOf: supportedScanPairs.map((pair) => ({
        properties: {
            bodyPart: { const: pair.bodyPart },
            imageType: { const: pair.imageType },
        },
    })),
};

export const validateCreateScan = ajv.compile(schema);
