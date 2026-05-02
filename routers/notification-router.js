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
    authorizeRoles("patient"),
    getNotifications,
);

router.get(
    "/notifications/unread-count",
    authenticate,
    authorizeRoles("patient"),
    getUnreadNotificationCount,
);

router.patch(
    "/notifications/:uuid/read",
    authenticate,
    authorizeRoles("patient"),
    markNotificationAsRead,
);

router.patch(
    "/notifications/read-all",
    authenticate,
    authorizeRoles("patient"),
    markAllNotificationsAsRead,
);

router.delete(
    "/notifications/:uuid",
    authenticate,
    authorizeRoles("patient"),
    deleteNotification,
);

export default router;
