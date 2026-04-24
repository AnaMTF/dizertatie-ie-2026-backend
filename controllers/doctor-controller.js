import * as doctorService from "../services/doctor-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function createDoctor(request, response) {
    try {
        const doctor = await doctorService.createDoctor(request.body);
        sendSuccess(response, 201, doctor);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function replaceDoctor(request, response) {
    try {
        const { uuid } = request.params;
        const doctor = await doctorService.replaceDoctor(
            uuid,
            request.body,
            request.user,
        );
        if (!doctor) {
            return sendError(response, 404, "Doctor not found");
        }
        sendSuccess(response, 200, doctor);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function updateDoctor(request, response) {
    try {
        const { uuid } = request.params;
        const doctor = await doctorService.updateDoctor(
            uuid,
            request.body,
            request.user,
        );
        if (!doctor) {
            return sendError(response, 404, "Doctor not found");
        }
        sendSuccess(response, 200, doctor);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deleteDoctor(request, response) {
    try {
        const { uuid } = request.params;
        const deleted = await doctorService.deleteDoctor(uuid, request.user);
        if (!deleted) {
            return sendError(response, 404, "Doctor not found");
        }
        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getDoctors(request, response) {
    try {
        const doctors = await doctorService.getDoctors();
        sendSuccess(response, 200, doctors);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getDoctorByUuid(request, response) {
    try {
        const { uuid } = request.params;
        const doctor = await doctorService.getDoctorByUuid(uuid);
        if (!doctor) {
            return sendError(response, 404, "Doctor not found");
        }
        sendSuccess(response, 200, doctor);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
