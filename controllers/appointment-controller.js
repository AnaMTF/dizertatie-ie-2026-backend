import * as appointmentService from "../services/appointment-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

/* crud */
export async function createAppointment(request, response) {
    try {
        const appointment = await appointmentService.createAppointment(
            request.body,
            request.user,
        );
        sendSuccess(response, 201, appointment);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function replaceAppointment(request, response) {
    try {
        const { uuid } = request.params;
        const appointment = await appointmentService.replaceAppointment(
            uuid,
            request.body,
            request.user,
        );
        if (!appointment) {
            return sendError(response, 404, "Appointment not found");
        }
        sendSuccess(response, 200, appointment);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function updateAppointment(request, response) {
    try {
        const { uuid } = request.params;
        const appointment = await appointmentService.updateAppointment(
            uuid,
            request.body,
            request.user,
        );
        if (!appointment) {
            return sendError(response, 404, "Appointment not found");
        }
        sendSuccess(response, 200, appointment);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deleteAppointment(request, response) {
    try {
        const { uuid } = request.params;
        const deleted = await appointmentService.deleteAppointment(
            uuid,
            request.user,
        );
        if (!deleted) {
            return sendError(response, 404, "Appointment not found");
        }
        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

/* queries */
export async function getAppointments(request, response) {
    try {
        const appointments = await appointmentService.getAppointments(
            request.user,
        );
        sendSuccess(response, 200, appointments);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getAppointmentByUuid(request, response) {
    try {
        const { uuid } = request.params;
        const appointment = await appointmentService.getAppointmentByUuid(
            uuid,
            request.user,
        );
        if (!appointment) {
            return sendError(response, 404, "Appointment not found");
        }
        sendSuccess(response, 200, appointment);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
