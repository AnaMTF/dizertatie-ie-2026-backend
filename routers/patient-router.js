import express from "express";
import {
    createPatient,
    replacePatient,
    updatePatient,
    deletePatient,
    getPatients,
    getPatientByUuid,
} from "../controllers/index.js";
import { authenticate, authorizeRoles, validate } from "../middleware/index.js";
import {
    validateCreatePatient,
    validateReplacePatient,
    validateUpdatePatient,
} from "../validators/index.js";

const router = express.Router();

router.post(
    "/patient",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateCreatePatient),
    createPatient,
);

router.put(
    "/patient/:uuid",
    authenticate,
    authorizeRoles("patient"),
    validate(validateReplacePatient),
    replacePatient,
);

router.patch(
    "/patient/:uuid",
    authenticate,
    authorizeRoles("patient"),
    validate(validateUpdatePatient),
    updatePatient,
);

router.delete(
    "/patient/:uuid",
    authenticate,
    authorizeRoles("patient"),
    deletePatient,
);

router.get(
    "/patient",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getPatients,
);

router.get(
    "/patient/:uuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getPatientByUuid,
);

export default router;
