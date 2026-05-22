import { contactSubmissionModel } from "../models/index.js";
import { createError } from "../utils/error.js";
import { getSmtpFromEmail, sendEmail } from "./email-service.js";

const CONTACT_RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL;

function toPublicContactSubmission(contactSubmission) {
    return {
        uuid: contactSubmission.uuid,
        fullName: contactSubmission.fullName,
        email: contactSubmission.email,
        phone: contactSubmission.phone,
        subject: contactSubmission.subject,
        message: contactSubmission.message,
        createdAt: contactSubmission.createdAt,
    };
}

function ensureContactRecipientEmail() {
    if (!CONTACT_RECIPIENT_EMAIL) {
        throw createError(500, "CONTACT_RECIPIENT_EMAIL is not configured");
    }

    return CONTACT_RECIPIENT_EMAIL;
}

function buildEmailBody(submission) {
    return [
        "A new contact form submission was received.",
        "",
        `Full name: ${submission.fullName}`,
        `Email: ${submission.email}`,
        `Phone: ${submission.phone}`,
        `Subject: ${submission.subject}`,
        "",
        "Message:",
        submission.message,
    ].join("\n");
}

export async function createContactSubmission(data) {
    const submission = await contactSubmissionModel.create({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        subject: data.subject.trim(),
        message: data.message.trim(),
    });

    const recipientEmail = ensureContactRecipientEmail();
    const from = getSmtpFromEmail();

    await sendEmail({
        from,
        to: recipientEmail,
        replyTo: submission.email,
        subject: `[Contact] ${submission.subject}`,
        text: buildEmailBody(submission),
    });

    return toPublicContactSubmission(submission);
}
