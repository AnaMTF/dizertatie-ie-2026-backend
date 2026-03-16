import * as appointmentService from "../services/appointment-service.js";

function handleError(response, error) {
    response.status(error.status || 500).json({ message: error.message });
}

/* crud */
async function createAppointment(request, response) {
    try {
        const appointment = await appointmentService.createAppointment(request.body, request.user);
        response.status(201).json({
            message: "New appointment created",
            data: appointment,
        });
    } catch (error) {
        handleError(response, error);
    }
}

async function replaceAppointment(request, response) {
    try {
        const { id } = request.params;
        const appointment = await appointmentService.replaceAppointment(id, request.body, request.user);
        if (!appointment) {
            return response.status(404).json({ message: "Appointment not found" });
        }
        response.status(200).json({ appointment });
    } catch (error) {
        handleError(response, error);
    }
}

async function updateAppointment(request, response) {
    try {
        const { id } = request.params;
        const appointment = await appointmentService.updateAppointment(id, request.body, request.user);
        if (!appointment) {
            return response.status(404).json({ message: "Appointment not found" });
        }
        response.status(200).json({ appointment });
    } catch (error) {
        handleError(response, error);
    }
}

async function deleteAppointment(request, response) {
    try {
        const { id } = request.params;
        const deleted = await appointmentService.deleteAppointment(id, request.user);
        if (!deleted) {
            return response.status(404).json({ message: "Appointment not found" });
        }
        response.status(204).send();
    } catch (error) {
        handleError(response, error);
    }
}

/* queries */
async function getAppointments(request, response) {
    try {
        const appointments = await appointmentService.getAppointments(request.user);
        response.status(200).json({ appointments });
    } catch (error) {
        handleError(response, error);
    }
}

async function getAppointmentById(request, response) {
    try {
        const { id } = request.params;
        const appointment = await appointmentService.getAppointmentById(id, request.user);
        if (!appointment) {
            return response.status(404).json({ message: "Appointment not found" });
        }
        response.status(200).json({ appointment });
    } catch (error) {
        handleError(response, error);
    }
}

export default {
    createAppointment,
    replaceAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointments,
    getAppointmentById,
};