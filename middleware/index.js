import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

export function validate(validateFn) {
    return (request, response, next) => {
        const isValid = validateFn(request.body);

        if (!isValid) {
            return sendError(response, 400, validateFn.errors);
        }

        next();
    };
}

export function authenticate(request, response, next) {
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return sendError(response, 401, "Authentication required");
    }

    const token = authorization.slice(7);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        request.user = payload;
        next();
    } catch {
        return sendError(response, 401, "Invalid or expired token");
    }
}

export function authorizeRoles(...allowedRoles) {
    return (request, response, next) => {
        if (!request.user) {
            return sendError(response, 401, "Authentication required");
        }

        if (!allowedRoles.includes(request.user.role)) {
            return sendError(response, 403, "Forbidden");
        }

        next();
    };
}

export function parseScanMetadata(req, res, next) {
    try {
        req.body = JSON.parse(req.body.metadata);
        next();
    } catch {
        return sendError(res, 400, "Invalid metadata JSON.");
    }
}

export function validateFileCount(req, res, next) {
    if (!req.files?.length) {
        return sendError(res, 400, "At least one image is required.");
    }

    if (req.files.length !== req.body.length) {
        return sendError(
            res,
            400,
            "Each uploaded image must have one metadata item.",
        );
    }

    next();
}
