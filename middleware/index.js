import jwt from "jsonwebtoken";

function validate(validateFn) {
    return (request, response, next) => {
        const isValid = validateFn(request.body);

        if (!isValid) {
            return response.status(400).json({ errors: validateFn.errors });
        }

        next();
    };
}

function authenticate(request, response, next) {
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Authentication required" });
    }

    const token = authorization.slice(7);

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
        request.user = payload;
        next();
    } catch {
        return response.status(401).json({ message: "Invalid or expired token" });
    }
}

function authorizeRoles(...allowedRoles) {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: "Authentication required" });
        }

        if (!allowedRoles.includes(request.user.role)) {
            return response.status(403).json({ message: "Forbidden" });
        }

        next();
    };
}

export default {
    validate,
    authenticate,
    authorizeRoles,
};
