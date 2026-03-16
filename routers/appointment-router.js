import express from "express";
import controllers from "../controllers/index.js";
import middleware from "../middleware/index.js";
import validators from "../validators/index.js";

const router = express.Router();

router.post("/appointment", middleware.authenticate, middleware.authorizeRoles("patient"), middleware.validate(validators.validateCreateAppointment), controllers.appointmentController.createAppointment);
router.put("/appointment/:id", middleware.authenticate, middleware.authorizeRoles("patient"), middleware.validate(validators.validateReplaceAppointment), controllers.appointmentController.replaceAppointment);
router.patch("/appointment/:id", middleware.authenticate, middleware.authorizeRoles("patient", "doctor"), middleware.validate(validators.validateUpdateAppointment), controllers.appointmentController.updateAppointment);
router.delete("/appointment/:id", middleware.authenticate, middleware.authorizeRoles("patient"), controllers.appointmentController.deleteAppointment);
router.get("/appointment", middleware.authenticate, middleware.authorizeRoles("patient", "doctor"), controllers.appointmentController.getAppointments);
router.get("/appointment/:id", middleware.authenticate, middleware.authorizeRoles("patient", "doctor"), controllers.appointmentController.getAppointmentById);

export default router;