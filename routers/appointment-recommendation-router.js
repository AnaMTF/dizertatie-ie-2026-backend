import express from "express";

import {
    getAppointmentRecommendations,
    refreshAppointmentRecommendations,
} from "../controllers/index.js";
import { authenticate, authorizeRoles } from "../middleware/index.js";

const router = express.Router();

router.get(
    "/appointment/recommendations",
    authenticate,
    authorizeRoles("patient"),
    getAppointmentRecommendations,
);

router.post(
    "/appointment/recommendations/refresh",
    authenticate,
    authorizeRoles("patient"),
    refreshAppointmentRecommendations,
);

export default router;
