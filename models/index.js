import { appointmentModel } from "./appointment-model.js";
import { appointmentDocumentModel } from "./appointment-document-model.js";
import { appointmentRecommendationModel } from "./appointment-recommendation-model.js";
import { clinicModel } from "./clinic-model.js";
import { doctorModel } from "./doctor-model.js";
import { followUpReminderModel } from "./follow-up-reminder-model.js";
import { notificationModel } from "./notification-model.js";
import { patientModel } from "./patient-model.js";
import { postEmbeddingModel } from "./post-embedding-model.js";
import { pushDeliveryLogModel } from "./push-delivery-log-model.js";
import { pushDeliveryQueueModel } from "./push-delivery-queue-model.js";
import { pushSubscriptionModel } from "./push-subscription-model.js";
import { scanModel } from "./scan-model.js";
import { scanImageModel } from "./scan-image-model.js";

clinicModel.hasMany(doctorModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "doctors",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

doctorModel.belongsTo(clinicModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "clinic",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

patientModel.hasMany(appointmentModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "appointments",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

doctorModel.hasMany(appointmentModel, {
    foreignKey: {
        name: "doctorUuid",
        allowNull: false,
    },
    as: "appointments",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentModel.belongsTo(doctorModel, {
    foreignKey: {
        name: "doctorUuid",
        allowNull: false,
    },
    as: "doctor",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

clinicModel.hasMany(appointmentModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "appointments",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

appointmentModel.belongsTo(clinicModel, {
    foreignKey: {
        name: "clinicUuid",
        allowNull: false,
    },
    as: "clinic",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
});

appointmentModel.hasMany(appointmentDocumentModel, {
    foreignKey: {
        name: "appointmentUuid",
        allowNull: false,
    },
    as: "documents",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentDocumentModel.belongsTo(appointmentModel, {
    foreignKey: {
        name: "appointmentUuid",
        allowNull: false,
    },
    as: "appointment",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

patientModel.hasMany(scanModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "scans",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

scanModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

scanModel.hasMany(scanImageModel, {
    foreignKey: {
        name: "scanUuid",
        allowNull: false,
    },
    as: "images",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

scanImageModel.belongsTo(scanModel, {
    foreignKey: {
        name: "scanUuid",
        allowNull: false,
    },
    as: "scan",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

patientModel.hasMany(pushSubscriptionModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "pushSubscriptions",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

pushSubscriptionModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

patientModel.hasMany(notificationModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "notifications",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

notificationModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

patientModel.hasMany(followUpReminderModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "followUpReminders",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

followUpReminderModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentModel.hasMany(followUpReminderModel, {
    foreignKey: {
        name: "appointmentUuid",
        allowNull: false,
    },
    as: "followUpReminders",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

followUpReminderModel.belongsTo(appointmentModel, {
    foreignKey: {
        name: "appointmentUuid",
        allowNull: false,
    },
    as: "appointment",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

patientModel.hasMany(appointmentRecommendationModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "appointmentRecommendations",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

appointmentRecommendationModel.belongsTo(patientModel, {
    foreignKey: {
        name: "patientUuid",
        allowNull: false,
    },
    as: "patient",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

notificationModel.hasMany(pushDeliveryQueueModel, {
    foreignKey: { name: "notificationUuid", allowNull: false },
    as: "deliveryQueue",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

pushDeliveryQueueModel.belongsTo(notificationModel, {
    foreignKey: { name: "notificationUuid", allowNull: false },
    as: "notification",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

pushSubscriptionModel.hasMany(pushDeliveryQueueModel, {
    foreignKey: { name: "subscriptionUuid", allowNull: false },
    as: "deliveryQueue",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

pushDeliveryQueueModel.belongsTo(pushSubscriptionModel, {
    foreignKey: { name: "subscriptionUuid", allowNull: false },
    as: "subscription",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

notificationModel.hasMany(pushDeliveryLogModel, {
    foreignKey: { name: "notificationUuid", allowNull: false },
    as: "deliveryLogs",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

pushDeliveryLogModel.belongsTo(notificationModel, {
    foreignKey: { name: "notificationUuid", allowNull: false },
    as: "notification",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
});

export {
    appointmentModel,
    appointmentDocumentModel,
    appointmentRecommendationModel,
    clinicModel,
    doctorModel,
    followUpReminderModel,
    notificationModel,
    patientModel,
    postEmbeddingModel,
    pushDeliveryLogModel,
    pushDeliveryQueueModel,
    pushSubscriptionModel,
    scanModel,
    scanImageModel,
};
