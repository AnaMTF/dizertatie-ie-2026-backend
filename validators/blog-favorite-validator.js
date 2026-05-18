import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
    type: "object",
    required: ["slug"],
    additionalProperties: false,
    properties: {
        slug: {
            type: "string",
            minLength: 1,
        },
    },
};

export const validateBlogFavorite = ajv.compile(schema);
