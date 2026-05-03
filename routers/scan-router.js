import express from "express";
import multer from "multer";

import {
    createScan,
    getOptimizedScanImage,
    getScanByUuid,
    getScanOptions,
    getScans,
} from "../controllers/index.js";
import {
    authenticate,
    authorizeRoles,
    parseScanMetadata,
    validate,
    validateFileCount,
} from "../middleware/index.js";
import { validateCreateScan } from "../validators/index.js";

const router = express.Router();
const upload = multer({
    dest: "uploads/",
    limits: {
        files: 4,
        fileSize: 20 * 1024 * 1024, // 20 MiBs
    },
});

router.post(
    "/scan",
    authenticate,
    authorizeRoles("patient"),
    upload.array("images", 4),
    parseScanMetadata,
    validate(validateCreateScan),
    validateFileCount,
    createScan,
);

router.get(
    "/scan/options",
    authenticate,
    authorizeRoles("patient"),
    getScanOptions,
);

router.get("/scan", authenticate, authorizeRoles("patient"), getScans);

router.get(
    "/scan/:scanUuid/images/:imageUuid",
    authenticate,
    authorizeRoles("patient"),
    getOptimizedScanImage,
);

router.get(
    "/scan/:uuid",
    authenticate,
    authorizeRoles("patient"),
    getScanByUuid,
);

export default router;
