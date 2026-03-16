import express from "express";
import controllers from "../controllers/index.js";
import middleware from "../middleware/index.js";
import validateLogin from "../validators/login-validator.js";
import validateRegister from "../validators/register-validator.js";

const router = express.Router();

router.post("/login", middleware.validate(validateLogin), controllers.authenticationController.login);
router.post("/register", middleware.validate(validateRegister), controllers.authenticationController.register);
router.post("/logout", middleware.authenticate, controllers.authenticationController.logout);

export default router;