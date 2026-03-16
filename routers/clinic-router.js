import express from "express";
import {
    createClinic,
    replaceClinic,
    updateClinic,
    deleteClinic,
    getClinics,
    getClinicById,
} from "../controllers/index.js";
import { authenticate, authorizeRoles, validate } from "../middleware/index.js";
import {
    validateCreateClinic,
    validateReplaceClinic,
    validateUpdateClinic,
} from "../validators/index.js";

const router = express.Router();

router.post(
    "/clinic",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateCreateClinic),
    createClinic,
);

router.put(
    "/clinic/:id",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateReplaceClinic),
    replaceClinic,
);

router.patch(
    "/clinic/:id",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateUpdateClinic),
    updateClinic,
);

router.delete(
    "/clinic/:id",
    authenticate,
    authorizeRoles("doctor"),
    deleteClinic,
);

router.get("/clinic", getClinics);

router.get("/clinic/:id", getClinicById);

export default router;
