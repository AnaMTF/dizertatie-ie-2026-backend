import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const schema = {
    type: "object",
    required: ["date", "timeSlot", "doctorUuid", "clinicUuid"],
    additionalProperties: false,
    properties: {
        date: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        timeSlot: {
            type: "string",
            enum: timeSlots,
        },
        doctorUuid: {
            type: "string",
            format: "uuid",
        },
        clinicUuid: {
            type: "string",
            format: "uuid",
        },
        notes: {
            type: "string",
            maxLength: 5000,
        },
    },
};

export const validateCreateAppointment = ajv.compile(schema);
