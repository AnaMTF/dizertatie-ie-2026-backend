import express from "express";
import { login, lookupEmail, logout, register } from "../controllers/index.js";
import { authenticate, validate } from "../middleware/index.js";
import {
    validateEmailLookup,
    validateLogin,
    validateRegister,
} from "../validators/index.js";

const router = express.Router();

router.post("/login", validate(validateLogin), login);
router.post("/email-lookup", validate(validateEmailLookup), lookupEmail);
router.post("/register", validate(validateRegister), register);
router.post("/logout", authenticate, logout);

export default router;
