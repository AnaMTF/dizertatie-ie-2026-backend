import express from "express";
import controllers from "../controllers/index.js";
import middleware from "../middleware/index.js";
import validators from "../validators/index.js";

const router = express.Router();

router.post("/clinic", middleware.authenticate, middleware.authorizeRoles("doctor"), middleware.validate(validators.validateCreateClinic), controllers.clinicController.createClinic);
router.put("/clinic/:id", middleware.authenticate, middleware.authorizeRoles("doctor"), middleware.validate(validators.validateReplaceClinic), controllers.clinicController.replaceClinic);
router.patch("/clinic/:id", middleware.authenticate, middleware.authorizeRoles("doctor"), middleware.validate(validators.validateUpdateClinic), controllers.clinicController.updateClinic);
router.delete("/clinic/:id", middleware.authenticate, middleware.authorizeRoles("doctor"), controllers.clinicController.deleteClinic);
router.get("/clinic", controllers.clinicController.getClinics);
router.get("/clinic/:id", controllers.clinicController.getClinicById);

export default router;
