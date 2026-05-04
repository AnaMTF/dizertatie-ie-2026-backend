import * as appointmentRecommendationService from "../services/appointment-recommendation-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function getAppointmentRecommendations(request, response) {
    try {
        const recommendations =
            await appointmentRecommendationService.listAppointmentRecommendations(
                request.user,
                request.query,
            );

        sendSuccess(response, 200, recommendations);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}

export async function refreshAppointmentRecommendations(request, response) {
    try {
        const refreshed =
            await appointmentRecommendationService.refreshAppointmentRecommendationsFromUser(
                request.user,
                {
                    source: "manual_refresh",
                    sendNotification: false,
                },
            );

        sendSuccess(response, 200, refreshed);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
