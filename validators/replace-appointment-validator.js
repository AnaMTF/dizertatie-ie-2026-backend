import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["dateTime", "status"],
    additionalProperties: false,
    properties: {
        dateTime: {
            type: "string",
            format: "date-time"
        },
        status: {
            type: "string",
            enum: ["scheduled", "cancelled", "rescheduled"]
        },
        cancellationReason: {
            type: "string",
            maxLength: 1000
        }
    }
};

export const validateReplaceAppointment = ajv.compile(schema);
