import express from "express";
import { login, logout, register } from "../controllers/index.js";
import { authenticate, validate } from "../middleware/index.js";
import { validateLogin, validateRegister } from "../validators/index.js";

const router = express.Router();

router.post("/login", validate(validateLogin), login);
router.post("/register", validate(validateRegister), register);
router.post("/logout", authenticate, logout);

export default router;
