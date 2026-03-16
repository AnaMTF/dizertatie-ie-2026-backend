import * as appointmentService from "../services/appointment-service.js";

/* crud */
export async function createAppointment(request, response) {
    try {
        const appointment = await appointmentService.createAppointment(
            request.body,
            request.user,
        );
        response.status(201).json({
            message: "New appointment created",
            data: appointment,
        });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
            return response
                .status(404)
                .json({ message: "Appointment not found" });
        }
        response.status(200).json({ appointment });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
            return response
                .status(404)
                .json({ message: "Appointment not found" });
        }
        response.status(200).json({ appointment });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
            return response
                .status(404)
                .json({ message: "Appointment not found" });
        }
        response.status(204).send();
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

/* queries */
export async function getAppointments(request, response) {
    try {
        const appointments = await appointmentService.getAppointments(
            request.user,
        );
        response.status(200).json({ appointments });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
            return response
                .status(404)
                .json({ message: "Appointment not found" });
        }
        response.status(200).json({ appointment });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}
