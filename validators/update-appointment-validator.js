import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const schema = {
    type: "object",
    minProperties: 1,
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
        status: {
            type: "string",
            enum: [
                "scheduled",
                "confirmed",
                "cancelled",
                "rescheduled",
                "completed",
            ],
        },
        cancellationReason: {
            type: "string",
            maxLength: 1000,
        },
        notes: {
            type: "string",
            maxLength: 5000,
        },
    },
    allOf: [
        {
            if: {
                required: ["date"],
            },
            then: {
                required: ["timeSlot"],
            },
        },
        {
            if: {
                required: ["timeSlot"],
            },
            then: {
                required: ["date"],
            },
        },
    ],
};

export const validateUpdateAppointment = ajv.compile(schema);
