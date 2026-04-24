import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

export function validate(validateFn) {
    return (request, response, next) => {
        const isValid = validateFn(request.body);

        if (!isValid) {
            return response.status(400).json({ errors: validateFn.errors });
        }

        next();
    };
}

export function authenticate(request, response, next) {
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return response
            .status(401)
            .json({ message: "Authentication required" });
    }

    const token = authorization.slice(7);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        request.user = payload;
        next();
    } catch {
        return response
            .status(401)
            .json({ message: "Invalid or expired token" });
    }
}

export function authorizeRoles(...allowedRoles) {
    return (request, response, next) => {
        if (!request.user) {
            return response
                .status(401)
                .json({ message: "Authentication required" });
        }

        if (!allowedRoles.includes(request.user.role)) {
            return response.status(403).json({ message: "Forbidden" });
        }

        next();
    };
}

export function parseScanMetadata(req, res, next) {
    try {
        req.body = JSON.parse(req.body.metadata);
        next();
    } catch {
        return res.status(400).json({ error: "Invalid metadata JSON." });
    }
}

export function validateFileCount(req, res, next) {
    if (!req.files?.length) {
        return res
            .status(400)
            .json({ error: "At least one image is required." });
    }

    if (req.files.length !== req.body.length) {
        return res.status(400).json({
            error: "Each uploaded image must have one metadata item.",
        });
    }

    next();
}
