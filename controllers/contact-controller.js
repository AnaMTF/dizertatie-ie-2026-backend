import * as contactService from "../services/contact-service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export async function submitContact(request, response) {
    try {
        const submission = await contactService.createContactSubmission(
            request.body,
        );

        sendSuccess(response, 201, submission);
    } catch (error) {
        sendError(response, error.status || 500, error.message);
    }
}
