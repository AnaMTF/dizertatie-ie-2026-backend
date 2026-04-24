import * as clinicService from "../services/clinic-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function createClinic(request, response) {
    try {
        const clinic = await clinicService.createClinic(request.body);
        sendSuccess(response, 201, clinic);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function replaceClinic(request, response) {
    try {
        const { uuid } = request.params;
        const clinic = await clinicService.replaceClinic(uuid, request.body);
        if (!clinic) {
            return sendError(response, 404, "Clinic not found");
        }
        sendSuccess(response, 200, clinic);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function updateClinic(request, response) {
    try {
        const { uuid } = request.params;
        const clinic = await clinicService.updateClinic(uuid, request.body);
        if (!clinic) {
            return sendError(response, 404, "Clinic not found");
        }
        sendSuccess(response, 200, clinic);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deleteClinic(request, response) {
    try {
        const { uuid } = request.params;
        const deleted = await clinicService.deleteClinic(uuid);
        if (!deleted) {
            return sendError(response, 404, "Clinic not found");
        }
        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getClinics(request, response) {
    try {
        const clinics = await clinicService.getClinics();
        sendSuccess(response, 200, clinics);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getClinicByUuid(request, response) {
    try {
        const { uuid } = request.params;
        const clinic = await clinicService.getClinicByUuid(uuid);
        if (!clinic) {
            return sendError(response, 404, "Clinic not found");
        }
        sendSuccess(response, 200, clinic);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
