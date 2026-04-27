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
        if (error?.name === "SequelizeForeignKeyConstraintError") {
            return sendError(
                response,
                400,
                "Invalid appointment references. Please refresh and try again.",
            );
        }

        if (error?.name === "SequelizeValidationError") {
            const detail = error.errors?.[0]?.message || "Validation error";
            return sendError(response, 400, detail);
        }

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

export async function getAppointmentAvailability(request, response) {
    try {
        const availability =
            await appointmentService.getAppointmentAvailability(
                request.query,
                request.user,
            );
        sendSuccess(response, 200, availability);
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

export async function createAppointmentDocuments(request, response) {
    try {
        const { uuid } = request.params;
        const appointment = await appointmentService.createAppointmentDocuments(
            uuid,
            request.body,
            request.files,
            request.user,
        );

        sendSuccess(response, 201, appointment);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function getAppointmentDocumentByUuid(request, response) {
    try {
        const { uuid, documentUuid } = request.params;
        const document = await appointmentService.getAppointmentDocumentByUuid(
            uuid,
            documentUuid,
            request.user,
        );

        response.setHeader("Content-Type", document.mimeType);
        response.download(document.filePath, document.fileName);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function deleteAppointmentDocument(request, response) {
    try {
        const { uuid, documentUuid } = request.params;
        const deleted = await appointmentService.deleteAppointmentDocument(
            uuid,
            documentUuid,
            request.user,
        );

        if (!deleted) {
            return sendError(response, 404, "Document not found");
        }

        sendSuccess(response, 200, null);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
