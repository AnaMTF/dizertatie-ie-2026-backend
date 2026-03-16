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
