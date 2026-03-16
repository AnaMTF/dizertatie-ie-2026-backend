import express from "express";
import {
    createDoctor,
    replaceDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctors,
    getDoctorById,
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
    "/doctor/:id",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateReplaceDoctor),
    replaceDoctor,
);

router.patch(
    "/doctor/:id",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateUpdateDoctor),
    updateDoctor,
);

router.delete(
    "/doctor/:id",
    authenticate,
    authorizeRoles("doctor"),
    deleteDoctor,
);

router.get("/doctor", getDoctors);

router.get("/doctor/:id", getDoctorById);

export default router;
