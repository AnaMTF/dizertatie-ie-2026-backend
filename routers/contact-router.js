import { Router } from "express";

import { submitContact } from "../controllers/contact-controller.js";
import { validate } from "../middleware/index.js";
import { validateContactSubmission } from "../validators/contact-submission-validator.js";

const router = Router();

router.post("/contact", validate(validateContactSubmission), submitContact);

export default router;
