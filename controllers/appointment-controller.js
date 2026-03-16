import * as appointmentService from "../services/appointment-service.js";

/* crud */
async function createAppointment(request, response) {
    try {
        const appointment = await appointmentService.createAppointment(request.body, request.user);
        response.status(201).json({
            message: "New appointment created",
            data: appointment,
        });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
        response.status(error.status || 500).json({ message: error.message });
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
        response.status(error.status || 500).json({ message: error.message });
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
        response.status(error.status || 500).json({ message: error.message });
    }
}

/* queries */
async function getAppointments(request, response) {
    try {
        const appointments = await appointmentService.getAppointments(request.user);
        response.status(200).json({ appointments });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
        response.status(error.status || 500).json({ message: error.message });
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