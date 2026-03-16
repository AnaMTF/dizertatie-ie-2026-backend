import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const schema = {
    type: "object",
    required: ["dateTime", "doctorId", "clinicId"],
    additionalProperties: false,
    properties: {
        dateTime: {
            type: "string",
            format: "date-time"
        },
        doctorId: {
            type: "integer"
        },
        clinicId: {
            type: "integer"
        }
    }
};

const validate = ajv.compile(schema);

export default validate;
