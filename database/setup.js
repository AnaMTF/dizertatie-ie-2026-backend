import "dotenv/config";

const { default: bcrypt } = await import("bcryptjs");
const { default: database } = await import("./index.js");
await import("../models/index.js");
const { patientModel } = await import("../models/patient-model.js");
const { clinicModel } = await import("../models/clinic-model.js");
const { doctorModel } = await import("../models/doctor-model.js");
const { postEmbeddingModel } =
    await import("../models/post-embedding-model.js");
const { favoritePostModel } = await import("../models/favorite-post-model.js");
const { getBlogImagePathForSlug } = await import("./blog-image-paths.js");

const DOCTOR_PASSWORD = "password123";

const clinics = [
    {
        name: "Arbor Medical Cluj",
        address: "Str. Republicii 109, Cluj-Napoca",
        latitude: 46.7693792,
        longitude: 23.5899542,
        phone: "+40 123 123 1001",
        website: "https://arbor-medical.example",
        imagePath: "/clinic-images/clinic_1.webp",
    },
    {
        name: "Nova Care București",
        address: "Calea Floreasca 88, București",
        latitude: 44.4660818,
        longitude: 26.1046636,
        phone: "+40 123 123 1002",
        website: "https://nova-care.example",
        imagePath: "/clinic-images/clinic_2.jpg",
    },
    {
        name: "Cernica Health Sibiu",
        address: "Str. Învățătorului 2, Sibiu",
        latitude: 45.7956113,
        longitude: 24.1517425,
        phone: "+40 123 123 1003",
        website: "https://cernica-health.example",
        imagePath: "/clinic-images/clinic_3.webp",
    },
    {
        name: "Alba Clinic Timișoara",
        address: "Str. Gheorghe Lazăr 24, Timișoara",
        latitude: 45.7569863,
        longitude: 21.2284492,
        phone: "+40 123 123 1004",
        website: "https://alba-clinic.example",
        imagePath: "/clinic-images/clinic_4.jpg",
    },
    {
        name: "VitaPoint Brașov",
        address: "Str. Zizinului 19, Brașov",
        latitude: 45.6486158,
        longitude: 25.6071293,
        phone: "+40 123 123 1005",
        website: "https://vitapoint.example",
        imagePath: "/clinic-images/clinic_5.avif",
    },
    {
        name: "Solis Medical Iași",
        address: "Șos. Nicolina 4, Iași",
        latitude: 47.1422531,
        longitude: 27.5860716,
        phone: "+40 123 123 1006",
        website: "https://solis-medical.example",
        imagePath: "/clinic-images/clinic_6.jpg",
    },
    {
        name: "DeltaCare Constanța",
        address: "Bulevardul Tomis 92, Constanța",
        latitude: 44.1736782,
        longitude: 28.6349036,
        phone: "+40 123 123 1007",
        website: "https://deltacare.example",
        imagePath: "/clinic-images/clinic_7.jpg",
    },
    {
        name: "Aurora Health Oradea",
        address: "Calea Republicii 77, Oradea",
        latitude: 47.0536928,
        longitude: 21.9354208,
        phone: "+40 123 123 1008",
        website: "https://aurora-health.example",
        imagePath: "/clinic-images/clinic_8.jpg",
    },
    {
        name: "Lumen Medical Pitești",
        address: "Bulevardul Republicii 118, Pitești",
        latitude: 44.8543017,
        longitude: 24.8717075,
        phone: "+40 123 123 1009",
        website: "https://lumen-medical.example",
        imagePath: "/clinic-images/clinic_9.jpg",
    },
    {
        name: "Atlas Clinic Craiova",
        address: "Str. Calea Unirii 86, Craiova",
        latitude: 44.3245579,
        longitude: 23.7961551,
        phone: "+40 123 123 1010",
        website: "https://atlas-clinic.example",
        imagePath: "/clinic-images/clinic_10.webp",
    },
    {
        name: "Verde Medical Ploiești",
        address: "Str. Gheorghe Doja 102, Ploiești",
        latitude: 44.9384695,
        longitude: 26.0269162,
        phone: "+40 123 123 1011",
        website: "https://verde-medical.example",
        imagePath: "/clinic-images/clinic_11.jpg",
    },
    {
        name: "Nexus Health Galați",
        address: "Str. Brăilei 171, Galați",
        latitude: 45.4342937,
        longitude: 28.0379937,
        phone: "+40 123 123 1012",
        website: "https://nexus-health.example",
        imagePath: "/clinic-images/clinic_12.webp",
    },
];

const SPECIALIZATIONS = [
    "general",
    "cardiology",
    "dermatology",
    "endocrinology",
    "gastroenterology",
    "gynecology",
    "neurology",
    "oncology",
    "ophthalmology",
    "orthopedics",
    "otolaryngology",
    "psychiatry",
    "pulmonology",
    "urology",
];

const DOCTOR_FIRST_NAMES = [
    "Andrei",
    "Maria",
    "Elena",
    "Gheorghe",
    "Ioana",
    "Mihai",
    "Cristina",
    "Radu",
    "Alina",
    "Florin",
    "Daniela",
    "Sorin",
    "Adriana",
    "Bogdan",
    "Simona",
    "Laura",
    "Roxana",
    "Oana",
    "Victor",
    "Teodora",
    "Alexandru",
    "Marius",
    "Nicoleta",
    "Catalin",
    "Andreea",
    "Dan",
    "Irina",
    "Lucian",
    "Claudia",
    "Sebastian",
    "Monica",
    "Costin",
    "Raluca",
    "Stefan",
    "Bianca",
    "Vlad",
    "Camelia",
    "Ionut",
    "Gabriela",
    "Cristian",
    "Mirela",
    "Paul",
    "Daria",
    "Robert",
    "Lavinia",
    "Tudor",
    "Ana",
    "Matei",
    "Iulia",
    "Claudiu",
];

const DOCTOR_LAST_NAMES = [
    "Ionescu",
    "Popescu",
    "Dumitrescu",
    "Marin",
    "Stan",
    "Vlad",
    "Popa",
    "Neagu",
    "Barbu",
    "Dima",
    "Crisan",
    "Lazar",
    "Stoica",
    "Tudor",
    "Rus",
    "Ciobanu",
    "Niculescu",
    "Gheorghiu",
    "Dragomir",
    "Matei",
    "Petre",
    "Cojocaru",
    "Serban",
    "Preda",
    "Constantin",
    "Mocanu",
    "Florea",
    "Dobre",
    "Bucur",
    "Nica",
    "Lungu",
    "Voicu",
    "Badea",
    "Olaru",
    "Enache",
    "Chiriac",
    "Rotaru",
    "Apostol",
    "Manea",
    "Toma",
    "Oprea",
    "Nistor",
    "Rusu",
    "Munteanu",
    "Sandu",
    "Avram",
    "Iliescu",
    "Iacob",
    "Zamfir",
    "Vasilescu",
];

const DOCTORS_PER_CLINIC_AND_SPECIALIZATION = 4;

const doctors = SPECIALIZATIONS.flatMap((specialization, specializationIndex) =>
    clinics.flatMap((_, clinicIndex) =>
        Array.from(
            { length: DOCTORS_PER_CLINIC_AND_SPECIALIZATION },
            (_, slotIndex) => {
                const seed =
                    specializationIndex * 100 +
                    clinicIndex * DOCTORS_PER_CLINIC_AND_SPECIALIZATION +
                    slotIndex;

                return {
                    firstName:
                        DOCTOR_FIRST_NAMES[
                            (seed * 7 + clinicIndex) % DOCTOR_FIRST_NAMES.length
                        ],
                    lastName:
                        DOCTOR_LAST_NAMES[
                            (seed * 11 + specializationIndex) %
                                DOCTOR_LAST_NAMES.length
                        ],
                    email: `${specialization}.${clinicIndex + 1}.${slotIndex + 1}@testdoctor.com`,
                    specialization,
                    clinicIndex,
                };
            },
        ),
    ),
);

const patients = [
    {
        firstName: "Ana",
        lastName: "Marin",
        email: "ana.marin@testpatient.com",
        sex: "Woman",
        dateOfBirth: "1992-04-12",
        height: 168,
        weight: 62,
        favoriteClinicIndex: 0,
        additionalMedicalInfo: "Seasonal allergies",
        smoker: false,
        alcoholConsumptionFrequency: "monthly",
    },
    {
        firstName: "Mihnea",
        lastName: "Iacob",
        email: "mihnea.iacob@testpatient.com",
        sex: "Man",
        dateOfBirth: "1988-11-03",
        height: 181,
        weight: 84,
        favoriteClinicIndex: 1,
        additionalMedicalInfo: null,
        smoker: false,
        alcoholConsumptionFrequency: "never",
    },
    {
        firstName: "Eliza",
        lastName: "Dobre",
        email: "eliza.dobre@testpatient.com",
        sex: "Woman",
        dateOfBirth: "1996-07-21",
        height: 173,
        weight: 70,
        favoriteClinicIndex: 2,
        additionalMedicalInfo: "Follow-up after scan",
        smoker: false,
        alcoholConsumptionFrequency: "weekly",
    },
];

const favoriteBlogPosts = [
    {
        recipientRole: "patient",
        recipientIndex: 0,
        postSlug:
            "10-semne-care-ne-ajuta-sa-recunoastem-boala-cronica-de-rinichi-smart-medical",
    },
    {
        recipientRole: "patient",
        recipientIndex: 0,
        postSlug: "boli-de-inima-semne-si-simptome",
    },
    {
        recipientRole: "patient",
        recipientIndex: 1,
        postSlug: "bolile-pulmonare-simptome-diagnostic-si-tratament-sanador",
    },
    {
        recipientRole: "patient",
        recipientIndex: 1,
        postSlug:
            "afectiuni-ale-ochiului-care-sunt-cele-mai-comune-dr-max-farmacia",
    },
    {
        recipientRole: "patient",
        recipientIndex: 2,
        postSlug: "cancerul-simptome-si-semnale-de-alarma-medlife",
    },
    {
        recipientRole: "patient",
        recipientIndex: 2,
        postSlug:
            "200-de-afectiuni-ale-plamanului-au-simptome-similare-dar-cauze-diferite-sa-intelegem-bolile-interstitiale-pulmonare",
    },
    {
        recipientRole: "doctor",
        recipientIndex: 0,
        postSlug: "ekg-sau-ecg-ce-este-si-cum-se-interpreteaza-reginamaria",
    },
    {
        recipientRole: "doctor",
        recipientIndex: 4,
        postSlug: "boli-cardiovasculare-tipuri-cauze-simptome-dr-max",
    },
    {
        recipientRole: "doctor",
        recipientIndex: 7,
        postSlug: "afectiuni-oftalmologice-clinica-dr-munteanu",
    },
];

async function setup() {
    const dialect = process.env.DIALECT || "sqlite";

    if (dialect === "postgres") {
        const requiredVars = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"];
        const missingVars = requiredVars.filter(
            (variableName) => !process.env[variableName],
        );

        if (missingVars.length > 0) {
            throw new Error(
                `Missing required PostgreSQL environment variables: ${missingVars.join(
                    ", ",
                )}`,
            );
        }
    }

    console.log(`Seeding database using DIALECT=${dialect}`);

    await database.authenticate();
    if (dialect === "postgres") {
        await database.query("CREATE EXTENSION IF NOT EXISTS vector");
    }
    await database.sync({ force: true });

    const passwordHash = await bcrypt.hash(DOCTOR_PASSWORD, 10);

    const createdClinics = await clinicModel.bulkCreate(clinics, {
        ignoreDuplicates: true,
    });

    console.log(`Inserted ${createdClinics.length} clinics`);

    const doctorRows = doctors.map(({ clinicIndex, ...doctor }) => ({
        ...doctor,
        passwordHash,
        clinicUuid: createdClinics[clinicIndex].uuid,
    }));

    const createdDoctors = await doctorModel.bulkCreate(doctorRows, {
        ignoreDuplicates: true,
    });

    console.log(`Inserted ${createdDoctors.length} doctors`);

    const patientRows = patients.map(({ favoriteClinicIndex, ...patient }) => ({
        ...patient,
        passwordHash,
        favoriteClinicUuid: createdClinics[favoriteClinicIndex].uuid,
    }));

    const createdPatients = await patientModel.bulkCreate(patientRows, {
        ignoreDuplicates: true,
    });

    console.log(`Inserted ${createdPatients.length} patients`);

    const availablePosts = await postEmbeddingModel.findAll({
        attributes: ["slug"],
        raw: true,
    });

    for (const { slug } of availablePosts) {
        await postEmbeddingModel.update(
            {
                imagePath: getBlogImagePathForSlug(slug),
            },
            {
                where: {
                    slug,
                },
            },
        );
    }

    if (availablePosts.length > 0) {
        console.log(
            `Updated blog image paths for ${availablePosts.length} post embeddings`,
        );
    }

    const availablePostSlugs = new Set(availablePosts.map((item) => item.slug));

    const favoriteRows = favoriteBlogPosts
        .map(({ recipientRole, recipientIndex, postSlug }) => {
            if (!availablePostSlugs.has(postSlug)) {
                console.warn(
                    `Skipping favorite seed for missing post embedding slug: ${postSlug}`,
                );
                return null;
            }

            const recipientUuid =
                recipientRole === "patient"
                    ? createdPatients[recipientIndex]?.uuid
                    : createdDoctors[recipientIndex]?.uuid;

            if (!recipientUuid) {
                return null;
            }

            return {
                recipientRole,
                recipientUuid,
                postSlug,
            };
        })
        .filter(Boolean);

    const createdFavorites = await favoritePostModel.bulkCreate(favoriteRows, {
        ignoreDuplicates: true,
    });

    console.log(`Inserted ${createdFavorites.length} favorite blog posts`);

    await database.close();
}

setup().catch((error) => {
    console.error("Setup failed", error);
    process.exit(1);
});
