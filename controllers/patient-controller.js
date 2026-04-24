import * as patientService from "../services/patient-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

/* crud */
export async function createPatient(request, response) {
    try {
        const patient = await patientService.createPatient(request.body);
        sendSuccess(response, 201, patient);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function replacePatient(request, response) {
    try {
        const { uuid } = request.params;
        const patient = await patientService.replacePatient(
            uuid,
            request.body,
            request.user,
        );
        if (!patient) {
            return sendError(response, 404, "Patient not found");
        }
        sendSuccess(response, 200, patient);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function updatePatient(request, response) {
    try {
        const { uuid } = request.params;
        const patient = await patientService.updatePatient(
            uuid,
            request.body,
            request.user,
        );
        if (!patient) {
            return sendError(response, 404, "Patient not found");
        }
        sendSuccess(response, 200, patient);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deletePatient(request, response) {
    try {
        const { uuid } = request.params;
        const deleted = await patientService.deletePatient(uuid, request.user);
        if (!deleted) {
            return sendError(response, 404, "Patient not found");
        }
        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

/* queries */
export async function getPatients(request, response) {
    try {
        const patients = await patientService.getPatients(request.user);
        sendSuccess(response, 200, patients);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getPatientByUuid(request, response) {
    try {
        const { uuid } = request.params;
        const patient = await patientService.getPatientByUuid(
            uuid,
            request.user,
        );
        if (!patient) {
            return sendError(response, 404, "Patient not found");
        }
        sendSuccess(response, 200, patient);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
