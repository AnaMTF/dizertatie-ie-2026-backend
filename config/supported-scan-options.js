export const supportedScanOptions = [
    {
        id: "brain-mri",
        label: "Brain MRI",
        description: "Brain MRI analyzed for brain tumor classification.",
        bodyPart: "Brain",
        imageType: "MRI",
        modelKeys: ["brain_mri_b3"],
        region: {
            key: "brain",
            name: "Brain",
            description: "MRI studies for intracranial tumor screening.",
        },
    },
    {
        id: "chest-xray",
        label: "Chest X-Ray",
        description: "Chest X-ray analyzed with tuberculosis and COVID models.",
        bodyPart: "Chest / lungs",
        imageType: "X-Ray",
        modelKeys: ["tb_chest_xray", "covid_radiography"],
        region: {
            key: "chest",
            name: "Chest / lungs",
            description: "Pulmonary X-ray screening and respiratory review.",
        },
    },
    {
        id: "kidney-ct",
        label: "Kidney CT",
        description:
            "CT scan analyzed for kidney cyst, stone, tumor, and normal findings.",
        bodyPart: "Kidney",
        imageType: "CT Scan",
        modelKeys: ["kidney_ct"],
        region: {
            key: "kidney",
            name: "Kidney",
            description: "Renal CT analysis for structural kidney findings.",
        },
    },
    {
        id: "liver-ct",
        label: "Liver CT",
        description:
            "CT scan analyzed for healthy versus fatty liver patterns.",
        bodyPart: "Liver",
        imageType: "CT Scan",
        modelKeys: ["liver_fatty_ct"],
        region: {
            key: "liver",
            name: "Liver",
            description: "Liver imaging for fatty liver assessment.",
        },
    },
    {
        id: "liver-ultrasound",
        label: "Liver Ultrasound",
        description:
            "Ultrasound analyzed for malignant versus non-malignant liver findings.",
        bodyPart: "Liver",
        imageType: "Ultrasound",
        modelKeys: ["liver_malignant_binary"],
        region: {
            key: "liver",
            name: "Liver",
            description: "Liver imaging for malignant screening workflows.",
        },
    },
    {
        id: "ovary-ultrasound",
        label: "Ovary Ultrasound",
        description:
            "Ultrasound analyzed for ovarian cyst and follicle classification.",
        bodyPart: "Ovary",
        imageType: "Ultrasound",
        modelKeys: ["ovarian_cyst"],
        region: {
            key: "ovary",
            name: "Ovary",
            description: "Pelvic ultrasound focused on ovarian findings.",
        },
    },
    {
        id: "knee-xray",
        label: "Knee X-Ray",
        description: "X-ray analyzed for osteoarthritis severity grading.",
        bodyPart: "Knee",
        imageType: "X-Ray",
        modelKeys: ["knee_xray_osteoarthritis"],
        region: {
            key: "knee",
            name: "Knee",
            description: "Knee X-ray grading for osteoarthritis severity.",
        },
    },
    {
        id: "cervix-colposcopy",
        label: "Cervix Colposcopy",
        description: "Cervical imagery analyzed for cancer screening classes.",
        bodyPart: "Cervix",
        imageType: "Colposcopy",
        modelKeys: ["cervical_cancer"],
        region: {
            key: "cervix",
            name: "Cervix",
            description: "Colposcopy imaging workflows for cervical screening.",
        },
    },
    {
        id: "chest-histopathology",
        label: "Chest Histopathology",
        description: "Histopathology tiles analyzed for lung cancer classes.",
        bodyPart: "Chest / lungs",
        imageType: "Histopathology",
        modelKeys: ["lung_colon_cancer"],
        region: {
            key: "chest",
            name: "Chest / lungs",
            description: "Pathology image review for lung tissue classes.",
        },
    },
    {
        id: "colon-histopathology",
        label: "Colon Histopathology",
        description: "Histopathology tiles analyzed for colon cancer classes.",
        bodyPart: "Colon",
        imageType: "Histopathology",
        modelKeys: ["lung_colon_cancer"],
        region: {
            key: "colon",
            name: "Colon",
            description: "Pathology image review for colon tissue classes.",
        },
    },
    {
        id: "lymph-node-histopathology",
        label: "Lymph Node Histopathology",
        description: "Histopathology analyzed for lymphoma-related classes.",
        bodyPart: "Lymph node",
        imageType: "Histopathology",
        modelKeys: ["lymphoma"],
        region: {
            key: "lymph-node",
            name: "Lymph node",
            description:
                "Lymph node pathology review for lymphoma classification.",
        },
    },
    {
        id: "retina-oct",
        label: "Retina OCT",
        description: "Retinal OCT analyzed for retinal disease classes.",
        bodyPart: "Retina",
        imageType: "OCT",
        modelKeys: ["retinal_oct_finetuned"],
        region: {
            key: "retina",
            name: "Retina",
            description:
                "Optical coherence tomography studies for retinal findings.",
        },
    },
    {
        id: "breast-histopathology",
        label: "Breast Histopathology",
        description: "Breast pathology imagery analyzed for cancer classes.",
        bodyPart: "Breast",
        imageType: "Histopathology",
        modelKeys: ["breast_cancer_best"],
        region: {
            key: "breast",
            name: "Breast",
            description:
                "Breast pathology workflows for lesion classification.",
        },
    },
    {
        id: "breast-ultrasound",
        label: "Breast Ultrasound",
        description:
            "Breast ultrasound analyzed for benign and malignant patterns.",
        bodyPart: "Breast",
        imageType: "Ultrasound",
        modelKeys: ["breast_ultrasound"],
        region: {
            key: "breast",
            name: "Breast",
            description: "Ultrasound-based breast screening workflows.",
        },
    },
    {
        id: "oral-cavity-photo",
        label: "Oral Cavity Image",
        description: "Oral lesion imagery analyzed for oral cancer classes.",
        bodyPart: "Oral cavity",
        imageType: "Clinical photo",
        modelKeys: ["oral_cancer_b3"],
        region: {
            key: "oral",
            name: "Oral cavity",
            description:
                "Clinical oral imagery for lesion-oriented classification.",
        },
    },
    {
        id: "skin-dermoscopy",
        label: "Skin Dermoscopy",
        description: "Skin lesion imagery analyzed for dermatology classes.",
        bodyPart: "Skin",
        imageType: "Dermoscopy",
        modelKeys: ["skin_best"],
        region: {
            key: "skin",
            name: "Skin",
            description: "Dermoscopic lesion review for skin class prediction.",
        },
    },
    {
        id: "heart-image",
        label: "Heart Imaging",
        description:
            "Cardiac images analyzed for abnormal versus normal classes.",
        bodyPart: "Heart",
        imageType: "Echocardiography",
        modelKeys: ["heart_abnormal_binary"],
        region: {
            key: "heart",
            name: "Heart",
            description:
                "Cardiac image workflows for binary abnormality support.",
        },
    },
    {
        id: "colon-endoscopy",
        label: "Colon Endoscopy",
        description:
            "Colonoscopy imagery analyzed for 8-class GI finding classification.",
        bodyPart: "Colon",
        imageType: "Endoscopy",
        modelKeys: ["colonoscopy_finetuned"],
        region: {
            key: "colon",
            name: "Colon",
            description:
                "Endoscopic colonoscopy review for gastrointestinal findings.",
        },
    },
];

export const supportedScanPairs = supportedScanOptions.map((option) => ({
    bodyPart: option.bodyPart,
    imageType: option.imageType,
}));

export const supportedScanBodyParts = [
    ...new Set(supportedScanOptions.map((option) => option.bodyPart)),
];

export const supportedScanImageTypes = [
    ...new Set(supportedScanOptions.map((option) => option.imageType)),
];
