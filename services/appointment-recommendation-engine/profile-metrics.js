const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365.2425;

export function calculateAgeYears(dateOfBirth, now = new Date()) {
    if (!dateOfBirth) {
        return null;
    }

    const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);

    if (Number.isNaN(dob.getTime())) {
        return null;
    }

    const ageYears = Math.floor((now.getTime() - dob.getTime()) / MS_IN_YEAR);
    return ageYears >= 0 ? ageYears : null;
}

export function calculateBmi(heightCm, weightKg) {
    const heightMeters = Number(heightCm) / 100;
    const weight = Number(weightKg);

    if (!Number.isFinite(heightMeters) || !Number.isFinite(weight)) {
        return null;
    }

    if (heightMeters <= 0 || weight <= 0) {
        return null;
    }

    return Number((weight / (heightMeters * heightMeters)).toFixed(2));
}
