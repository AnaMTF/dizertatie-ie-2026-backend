import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["dateTime", "doctorUuid", "clinicUuid"],
    additionalProperties: false,
    properties: {
        dateTime: {
            type: "string",
            format: "date-time",
        },
        doctorUuid: {
            type: "string",
            format: "uuid",
        },
        clinicUuid: {
            type: "string",
            format: "uuid",
        },
    },
};

export const validateCreateAppointment = ajv.compile(schema);
