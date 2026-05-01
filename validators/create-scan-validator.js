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
    type: "object",
    additionalProperties: false,
    required: ["bodyPart", "imageType"],
    properties: {
        bodyPart: {
            type: "string",
            enum: allowedBodyParts,
        },
        imageType: {
            type: "string",
            enum: allowedImageTypes,
        },
    },
};

export const validateCreateScan = ajv.compile(schema);
