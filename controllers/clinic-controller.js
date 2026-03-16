import * as clinicService from "../services/clinic-service.js";

export async function createClinic(request, response) {
    try {
        const clinic = await clinicService.createClinic(request.body);
        response.status(201).json({
            message: "New clinic created",
            data: clinic,
        });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function replaceClinic(request, response) {
    try {
        const { uuid } = request.params;
        const clinic = await clinicService.replaceClinic(uuid, request.body);
        if (!clinic) {
            return response.status(404).json({ message: "Clinic not found" });
        }
        response.status(200).json({ clinic });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function updateClinic(request, response) {
    try {
        const { uuid } = request.params;
        const clinic = await clinicService.updateClinic(uuid, request.body);
        if (!clinic) {
            return response.status(404).json({ message: "Clinic not found" });
        }
        response.status(200).json({ clinic });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function deleteClinic(request, response) {
    try {
        const { uuid } = request.params;
        const deleted = await clinicService.deleteClinic(uuid);
        if (!deleted) {
            return response.status(404).json({ message: "Clinic not found" });
        }
        response.status(204).send();
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function getClinics(request, response) {
    try {
        const clinics = await clinicService.getClinics();
        response.status(200).json({ clinics });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}

export async function getClinicByUuid(request, response) {
    try {
        const { uuid } = request.params;
        const clinic = await clinicService.getClinicByUuid(uuid);
        if (!clinic) {
            return response.status(404).json({ message: "Clinic not found" });
        }
        response.status(200).json({ clinic });
    } catch (error) {
        response.status(error.status || 500).json({ message: error.message });
    }
}
