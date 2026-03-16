import express from "express";
import {
    createAppointment,
    replaceAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointments,
    getAppointmentByUuid,
} from "../controllers/index.js";
import { authenticate, authorizeRoles, validate } from "../middleware/index.js";
import {
    validateCreateAppointment,
    validateReplaceAppointment,
    validateUpdateAppointment,
} from "../validators/index.js";

const router = express.Router();

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
    "/appointment/:uuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getAppointmentByUuid,
);

export default router;
