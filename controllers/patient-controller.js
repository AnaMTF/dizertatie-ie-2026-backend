import * as patientService from "../services/patient-service.js";

function handleError(response, error) {
    response.status(error.status || 500).json({ message: error.message });
}

/* crud */
async function createPatient(request, response) {
    try {
        const patient = await patientService.createPatient(request.body);
        response.status(201).json({
            message: "New patient created",
            data: patient,
        });
    } catch (error) {
        handleError(response, error);
    }
}

async function replacePatient(request, response) {
    try {
        const { id } = request.params;
        const patient = await patientService.replacePatient(id, request.body, request.user);
        if (!patient) {
            return response.status(404).json({ message: "Patient not found" });
        }
        response.status(200).json({ patient });
    } catch (error) {
        handleError(response, error);
    }
}

async function updatePatient(request, response) {
    try {
        const { id } = request.params;
        const patient = await patientService.updatePatient(id, request.body, request.user);
        if (!patient) {
            return response.status(404).json({ message: "Patient not found" });
        }
        response.status(200).json({ patient });
    } catch (error) {
        handleError(response, error);
    }
}

async function deletePatient(request, response) {
    try {
        const { id } = request.params;
        const deleted = await patientService.deletePatient(id, request.user);
        if (!deleted) {
            return response.status(404).json({ message: "Patient not found" });
        }
        response.status(204).send();
    } catch (error) {
        handleError(response, error);
    }
}

/* queries */
async function getPatients(request, response) {
    try {
        const patients = await patientService.getPatients(request.user);
        response.status(200).json({ patients });
    } catch (error) {
        handleError(response, error);
    }
}

async function getPatientById(request, response) {
    try {
        const { id } = request.params;
        const patient = await patientService.getPatientById(id, request.user);
        if (!patient) {
            return response.status(404).json({ message: "Patient not found" });
        }
        response.status(200).json({ patient });
    } catch (error) {
        handleError(response, error);
    }
}

export default {
    createPatient,
    replacePatient,
    updatePatient,
    deletePatient,
    getPatients,
    getPatientById,
};