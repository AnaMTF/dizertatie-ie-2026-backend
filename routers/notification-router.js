import express from "express";

import {
    deleteNotification,
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../controllers/index.js";
import { authenticate, authorizeRoles } from "../middleware/index.js";

const router = express.Router();

router.get(
    "/notifications",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getNotifications,
);

router.get(
    "/notifications/unread-count",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getUnreadNotificationCount,
);

router.patch(
    "/notifications/:uuid/read",
    authenticate,
    authorizeRoles("patient", "doctor"),
    markNotificationAsRead,
);

router.patch(
    "/notifications/read-all",
    authenticate,
    authorizeRoles("patient", "doctor"),
    markAllNotificationsAsRead,
);

router.delete(
    "/notifications/:uuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    deleteNotification,
);

export default router;
