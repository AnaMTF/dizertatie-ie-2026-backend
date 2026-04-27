import express from "express";
import multer from "multer";
import {
    createAppointmentDocuments,
    createAppointment,
    deleteAppointmentDocument,
    getAppointmentAvailability,
    getAppointmentDocumentByUuid,
    replaceAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointments,
    getAppointmentByUuid,
} from "../controllers/index.js";
import {
    authenticate,
    authorizeRoles,
    parseAppointmentDocumentMetadata,
    validate,
    validateAppointmentDocumentFileCount,
} from "../middleware/index.js";
import {
    validateCreateAppointment,
    validateCreateAppointmentDocuments,
    validateReplaceAppointment,
    validateUpdateAppointment,
} from "../validators/index.js";

const router = express.Router();
const upload = multer({
    dest: "uploads/",
    limits: {
        files: 5,
        fileSize: 20 * 1024 * 1024,
    },
});

router.post(
    "/appointment",
    authenticate,
    authorizeRoles("patient"),
    validate(validateCreateAppointment),
    createAppointment,
);

router.put(
    "/appointment/:uuid",
    authenticate,
    authorizeRoles("patient"),
    validate(validateReplaceAppointment),
    replaceAppointment,
);

router.patch(
    "/appointment/:uuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    validate(validateUpdateAppointment),
    updateAppointment,
);

router.delete(
    "/appointment/:uuid",
    authenticate,
    authorizeRoles("patient"),
    deleteAppointment,
);

router.get(
    "/appointment",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getAppointments,
);

router.get(
    "/appointment/availability",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getAppointmentAvailability,
);

router.post(
    "/appointment/:uuid/documents",
    authenticate,
    authorizeRoles("patient"),
    upload.array("documents", 5),
    parseAppointmentDocumentMetadata,
    validate(validateCreateAppointmentDocuments),
    validateAppointmentDocumentFileCount,
    createAppointmentDocuments,
);

router.get(
    "/appointment/:uuid/documents/:documentUuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getAppointmentDocumentByUuid,
);

router.delete(
    "/appointment/:uuid/documents/:documentUuid",
    authenticate,
    authorizeRoles("patient"),
    deleteAppointmentDocument,
);

router.get(
    "/appointment/:uuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getAppointmentByUuid,
);

export default router;
