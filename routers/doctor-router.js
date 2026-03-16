import express from "express";
import {
    createDoctor,
    replaceDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctors,
    getDoctorByUuid,
} from "../controllers/index.js";
import { authenticate, authorizeRoles, validate } from "../middleware/index.js";
import {
    validateCreateDoctor,
    validateReplaceDoctor,
    validateUpdateDoctor,
} from "../validators/index.js";

const router = express.Router();

router.post("/doctor", validate(validateCreateDoctor), createDoctor);

router.put(
    "/doctor/:uuid",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateReplaceDoctor),
    replaceDoctor,
);

router.patch(
    "/doctor/:uuid",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateUpdateDoctor),
    updateDoctor,
);

router.delete(
    "/doctor/:uuid",
    authenticate,
    authorizeRoles("doctor"),
    deleteDoctor,
);

router.get("/doctor", getDoctors);

router.get("/doctor/:uuid", getDoctorByUuid);

export default router;
