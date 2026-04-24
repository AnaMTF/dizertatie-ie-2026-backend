import * as authenticationService from "../services/authentication-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function register(request, response) {
    try {
        const patient = await authenticationService.register(request.body);
        sendSuccess(response, 201, patient);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function login(request, response) {
    try {
        const result = await authenticationService.login(request.body);
        sendSuccess(response, 200, result);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function lookupEmail(request, response) {
    try {
        const result = await authenticationService.lookupEmail(request.body);
        sendSuccess(response, 200, result);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function logout(request, response) {
    sendSuccess(response, 200, null);
}
