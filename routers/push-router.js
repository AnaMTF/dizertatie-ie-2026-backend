import express from "express";

import {
    createPushSubscription,
    deletePushSubscription,
    getPushPublicKey,
} from "../controllers/index.js";
import { authenticate, authorizeRoles, validate } from "../middleware/index.js";
import {
    validateCreatePushSubscription,
    validateDeletePushSubscription,
} from "../validators/index.js";

const router = express.Router();

router.get(
    "/push/public-key",
    authenticate,
    authorizeRoles("patient"),
    getPushPublicKey,
);

router.post(
    "/push/subscriptions",
    authenticate,
    authorizeRoles("patient"),
    validate(validateCreatePushSubscription),
    createPushSubscription,
);

router.delete(
    "/push/subscriptions",
    authenticate,
    authorizeRoles("patient"),
    validate(validateDeletePushSubscription),
    deletePushSubscription,
);

export default router;
