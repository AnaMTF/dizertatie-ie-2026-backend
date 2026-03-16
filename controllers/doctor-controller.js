import * as doctorService from "../services/doctor-service.js";

export async function createDoctor(request, response) {
    try {
        const doctor = await doctorService.createDoctor(request.body);
        response.status(201).json({
            message: "New doctor created",
            data: doctor,
        });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
            return response.status(404).json({ message: "Doctor not found" });
        }
        response.status(200).json({ doctor });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
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
            return response.status(404).json({ message: "Doctor not found" });
        }
        response.status(200).json({ doctor });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function deleteDoctor(request, response) {
    try {
        const { uuid } = request.params;
        const deleted = await doctorService.deleteDoctor(uuid, request.user);
        if (!deleted) {
            return response.status(404).json({ message: "Doctor not found" });
        }
        response.status(204).send();
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function getDoctors(request, response) {
    try {
        const doctors = await doctorService.getDoctors();
        response.status(200).json({ doctors });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function getDoctorByUuid(request, response) {
    try {
        const { uuid } = request.params;
        const doctor = await doctorService.getDoctorByUuid(uuid);
        if (!doctor) {
            return response.status(404).json({ message: "Doctor not found" });
        }
        response.status(200).json({ doctor });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}
