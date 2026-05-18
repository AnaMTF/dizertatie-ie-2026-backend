import express from "express";
import multer from "multer";

import {
    createScan,
    getDoctorReviewQueue,
    getDoctorReviewScanByUuid,
    getScanImageByUuid,
    getOptimizedScanImage,
    getScanByUuid,
    getScanOptions,
    getScans,
    verifyScanAsAccurate,
    verifyScanAsInaccurate,
} from "../controllers/index.js";
import {
    authenticate,
    authorizeRoles,
    parseScanMetadata,
    validate,
    validateFileCount,
} from "../middleware/index.js";
import { validateCreateScan, validateVerifyScan } from "../validators/index.js";

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

router.get(
    "/scan/review-queue",
    authenticate,
    authorizeRoles("doctor"),
    getDoctorReviewQueue,
);

router.get(
    "/scan/review-queue/:uuid",
    authenticate,
    authorizeRoles("doctor"),
    getDoctorReviewScanByUuid,
);

router.patch(
    "/scan/:uuid/verify-accurate",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateVerifyScan),
    verifyScanAsAccurate,
);

router.patch(
    "/scan/:uuid/verify-inaccurate",
    authenticate,
    authorizeRoles("doctor"),
    validate(validateVerifyScan),
    verifyScanAsInaccurate,
);

router.get("/scan", authenticate, authorizeRoles("patient"), getScans);

router.get(
    "/scan/:scanUuid/images/:imageUuid/download",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getScanImageByUuid,
);

router.get(
    "/scan/:scanUuid/images/:imageUuid",
    authenticate,
    authorizeRoles("patient", "doctor"),
    getOptimizedScanImage,
);

router.get(
    "/scan/:uuid",
    authenticate,
    authorizeRoles("patient"),
    getScanByUuid,
);

export default router;
