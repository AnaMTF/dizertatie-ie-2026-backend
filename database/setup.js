import "dotenv/config";

const { default: bcrypt } = await import("bcryptjs");
const { default: database } = await import("./index.js");
await import("../models/index.js");
const { clinicModel } = await import("../models/clinic-model.js");
const { doctorModel } = await import("../models/doctor-model.js");

const DOCTOR_PASSWORD = "password123";

const clinics = [
    { name: "Medicover Cluj", address: "Str. Republicii 109, Cluj-Napoca" },
    {
        name: "Regina Maria București",
        address: "Calea Floreasca 88, București",
    },
    { name: "Polisano Sibiu", address: "Str. Învățătorului 2, Sibiu" },
];

const doctors = [
    // General
    {
        firstName: "Andrei",
        lastName: "Ionescu",
        email: "andrei.ionescu@testdoctor.com",
        specialization: "general",
        clinicIndex: 0,
    },
    {
        firstName: "Maria",
        lastName: "Popescu",
        email: "maria.popescu@testdoctor.com",
        specialization: "general",
        clinicIndex: 0,
    },
    {
        firstName: "Elena",
        lastName: "Dumitrescu",
        email: "elena.dumitrescu@testdoctor.com",
        specialization: "general",
        clinicIndex: 1,
    },

    // Cardiology
    {
        firstName: "Gheorghe",
        lastName: "Marin",
        email: "gheorghe.marin@testdoctor.com",
        specialization: "cardiology",
        clinicIndex: 0,
    },
    {
        firstName: "Ioana",
        lastName: "Stan",
        email: "ioana.stan@testdoctor.com",
        specialization: "cardiology",
        clinicIndex: 1,
    },
    {
        firstName: "Mihai",
        lastName: "Vlad",
        email: "mihai.vlad@testdoctor.com",
        specialization: "cardiology",
        clinicIndex: 2,
    },

    // Dermatology
    {
        firstName: "Cristina",
        lastName: "Popa",
        email: "cristina.popa@testdoctor.com",
        specialization: "dermatology",
        clinicIndex: 0,
    },
    {
        firstName: "Radu",
        lastName: "Neagu",
        email: "radu.neagu@testdoctor.com",
        specialization: "dermatology",
        clinicIndex: 1,
    },
    {
        firstName: "Alina",
        lastName: "Barbu",
        email: "alina.barbu@testdoctor.com",
        specialization: "dermatology",
        clinicIndex: 2,
    },

    // Endocrinology
    {
        firstName: "Florin",
        lastName: "Dima",
        email: "florin.dima@testdoctor.com",
        specialization: "endocrinology",
        clinicIndex: 0,
    },
    {
        firstName: "Daniela",
        lastName: "Crisan",
        email: "daniela.crisan@testdoctor.com",
        specialization: "endocrinology",
        clinicIndex: 1,
    },
    {
        firstName: "Sorin",
        lastName: "Lazar",
        email: "sorin.lazar@testdoctor.com",
        specialization: "endocrinology",
        clinicIndex: 2,
    },

    // Gastroenterology
    {
        firstName: "Adriana",
        lastName: "Stoica",
        email: "adriana.stoica@testdoctor.com",
        specialization: "gastroenterology",
        clinicIndex: 0,
    },
    {
        firstName: "Bogdan",
        lastName: "Tudor",
        email: "bogdan.tudor@testdoctor.com",
        specialization: "gastroenterology",
        clinicIndex: 1,
    },
    {
        firstName: "Simona",
        lastName: "Rus",
        email: "simona.rus@testdoctor.com",
        specialization: "gastroenterology",
        clinicIndex: 2,
    },

    // Gynecology
    {
        firstName: "Laura",
        lastName: "Ciobanu",
        email: "laura.ciobanu@testdoctor.com",
        specialization: "gynecology",
        clinicIndex: 0,
    },
    {
        firstName: "Roxana",
        lastName: "Niculescu",
        email: "roxana.niculescu@testdoctor.com",
        specialization: "gynecology",
        clinicIndex: 1,
    },
    {
        firstName: "Oana",
        lastName: "Gheorghiu",
        email: "oana.gheorghiu@testdoctor.com",
        specialization: "gynecology",
        clinicIndex: 2,
    },

    // Neurology
    {
        firstName: "Victor",
        lastName: "Dragomir",
        email: "victor.dragomir@testdoctor.com",
        specialization: "neurology",
        clinicIndex: 0,
    },
    {
        firstName: "Teodora",
        lastName: "Matei",
        email: "teodora.matei@testdoctor.com",
        specialization: "neurology",
        clinicIndex: 1,
    },
    {
        firstName: "Alexandru",
        lastName: "Petre",
        email: "alexandru.petre@testdoctor.com",
        specialization: "neurology",
        clinicIndex: 2,
    },

    // Oncology
    {
        firstName: "Marius",
        lastName: "Cojocaru",
        email: "marius.cojocaru@testdoctor.com",
        specialization: "oncology",
        clinicIndex: 0,
    },
    {
        firstName: "Nicoleta",
        lastName: "Serban",
        email: "nicoleta.serban@testdoctor.com",
        specialization: "oncology",
        clinicIndex: 1,
    },
    {
        firstName: "Catalin",
        lastName: "Preda",
        email: "catalin.preda@testdoctor.com",
        specialization: "oncology",
        clinicIndex: 2,
    },

    // Ophthalmology
    {
        firstName: "Andreea",
        lastName: "Constantin",
        email: "andreea.constantin@testdoctor.com",
        specialization: "ophthalmology",
        clinicIndex: 0,
    },
    {
        firstName: "Dan",
        lastName: "Mocanu",
        email: "dan.mocanu@testdoctor.com",
        specialization: "ophthalmology",
        clinicIndex: 1,
    },
    {
        firstName: "Irina",
        lastName: "Florea",
        email: "irina.florea@testdoctor.com",
        specialization: "ophthalmology",
        clinicIndex: 2,
    },

    // Orthopedics
    {
        firstName: "Lucian",
        lastName: "Dobre",
        email: "lucian.dobre@testdoctor.com",
        specialization: "orthopedics",
        clinicIndex: 0,
    },
    {
        firstName: "Claudia",
        lastName: "Bucur",
        email: "claudia.bucur@testdoctor.com",
        specialization: "orthopedics",
        clinicIndex: 1,
    },
    {
        firstName: "Sebastian",
        lastName: "Nica",
        email: "sebastian.nica@testdoctor.com",
        specialization: "orthopedics",
        clinicIndex: 2,
    },

    // Otolaryngology
    {
        firstName: "Monica",
        lastName: "Lungu",
        email: "monica.lungu@testdoctor.com",
        specialization: "otolaryngology",
        clinicIndex: 0,
    },
    {
        firstName: "Costin",
        lastName: "Voicu",
        email: "costin.voicu@testdoctor.com",
        specialization: "otolaryngology",
        clinicIndex: 1,
    },
    {
        firstName: "Raluca",
        lastName: "Badea",
        email: "raluca.badea@testdoctor.com",
        specialization: "otolaryngology",
        clinicIndex: 2,
    },

    // Psychiatry
    {
        firstName: "Stefan",
        lastName: "Olaru",
        email: "stefan.olaru@testdoctor.com",
        specialization: "psychiatry",
        clinicIndex: 0,
    },
    {
        firstName: "Bianca",
        lastName: "Enache",
        email: "bianca.enache@testdoctor.com",
        specialization: "psychiatry",
        clinicIndex: 1,
    },
    {
        firstName: "Vlad",
        lastName: "Chiriac",
        email: "vlad.chiriac@testdoctor.com",
        specialization: "psychiatry",
        clinicIndex: 2,
    },

    // Pulmonology
    {
        firstName: "Camelia",
        lastName: "Rotaru",
        email: "camelia.rotaru@testdoctor.com",
        specialization: "pulmonology",
        clinicIndex: 0,
    },
    {
        firstName: "Ionut",
        lastName: "Apostol",
        email: "ionut.apostol@testdoctor.com",
        specialization: "pulmonology",
        clinicIndex: 1,
    },
    {
        firstName: "Gabriela",
        lastName: "Manea",
        email: "gabriela.manea@testdoctor.com",
        specialization: "pulmonology",
        clinicIndex: 2,
    },

    // Urology
    {
        firstName: "Cristian",
        lastName: "Toma",
        email: "cristian.toma@testdoctor.com",
        specialization: "urology",
        clinicIndex: 0,
    },
    {
        firstName: "Mirela",
        lastName: "Oprea",
        email: "mirela.oprea@testdoctor.com",
        specialization: "urology",
        clinicIndex: 1,
    },
    {
        firstName: "Paul",
        lastName: "Nistor",
        email: "paul.nistor@testdoctor.com",
        specialization: "urology",
        clinicIndex: 2,
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
    await database.sync();

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

    await database.close();
}

setup().catch((error) => {
    console.error("Setup failed", error);
    process.exit(1);
});
