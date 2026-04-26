import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const allowedBodyParts = [
    "Head / Brain",
    "Eyes",
    "Neck",
    "Chest",
    "Abdomen",
    "Pelvis",
    "Spine",
    "Shoulder",
    "Arm",
    "Elbow",
    "Wrist / Hand",
    "Hip",
    "Knee",
    "Ankle / Foot",
];

const allowedImageTypes = [
    "X-Ray",
    "CT Scan",
    "MRI",
    "Ultrasound",
    "PET Scan",
    "Mammography",
];

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
                enum: allowedBodyParts,
            },
            imageType: {
                type: "string",
                enum: allowedImageTypes,
            },
        },
    },
};

export const validateCreateScan = ajv.compile(schema);
