import * as authenticationService from "../services/authentication-service.js";

function handleError(response, error) {
    response.status(error.status || 500).json({ message: error.message });
}

async function register(request, response) {
    try {
        const patient = await authenticationService.register(request.body);
        response.status(201).json({
            message: "New patient created",
            data: patient,
        });
    } catch (error) {
        handleError(response, error);
    }
}

async function login(request, response) {
    try {
        const result = await authenticationService.login(request.body);
        response.status(200).json(result);
    } catch (error) {
        handleError(response, error);
    }
}

async function logout(request, response) {
    response.status(204).send();
}

export default {
    register,
    login,
    logout,
};
