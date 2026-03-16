import express from "express";
import controllers from "../controllers/index.js";
import middleware from "../middleware/index.js";
import validators from "../validators/index.js";

const router = express.Router();

router.post("/patient", middleware.authenticate, middleware.authorizeRoles("doctor"), middleware.validate(validators.validateCreatePatient), controllers.patientController.createPatient);
router.put("/patient/:id", middleware.authenticate, middleware.authorizeRoles("patient"), middleware.validate(validators.validateReplacePatient), controllers.patientController.replacePatient);
router.patch("/patient/:id", middleware.authenticate, middleware.authorizeRoles("patient"), middleware.validate(validators.validateUpdatePatient), controllers.patientController.updatePatient);
router.delete("/patient/:id", middleware.authenticate, middleware.authorizeRoles("patient"), controllers.patientController.deletePatient);
router.get("/patient", middleware.authenticate, middleware.authorizeRoles("patient", "doctor"), controllers.patientController.getPatients);
router.get("/patient/:id", middleware.authenticate, middleware.authorizeRoles("patient", "doctor"), controllers.patientController.getPatientById);

export default router;