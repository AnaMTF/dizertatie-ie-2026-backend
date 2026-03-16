import express from "express";
import controllers from "../controllers/index.js";
import middleware from "../middleware/index.js";
import validators from "../validators/index.js";

const router = express.Router();

router.post(
    "/doctor",
    middleware.validate(validators.validateCreateDoctor),
    controllers.doctorController.createDoctor);
    
router.put(
    "/doctor/:id",
    middleware.authenticate,
    middleware.authorizeRoles("doctor"),
    middleware.validate(validators.validateReplaceDoctor),
    controllers.doctorController.replaceDoctor);
    
router.patch(
    "/doctor/:id",
    middleware.authenticate,
    middleware.authorizeRoles("doctor"),
    middleware.validate(validators.validateUpdateDoctor),
    controllers.doctorController.updateDoctor);
    
router.delete(
    "/doctor/:id",
    middleware.authenticate,
    middleware.authorizeRoles("doctor"),
    controllers.doctorController.deleteDoctor);
    
router.get(
    "/doctor",
    controllers.doctorController.getDoctors);
    
router.get(
    "/doctor/:id",
    controllers.doctorController.getDoctorById);

export default router;
