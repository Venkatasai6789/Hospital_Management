export interface OperationsHospital {
    id: string;
    doctorName: string;
    hospitalName: string;
    specialty: string;
    district: string;
    address: string;
    totalBeds: number;
    occupiedBeds: number;
    totalVentilators: number;
    ventilatorsAvailable: number;
    staffOnDuty: number;
    patientLoad: number;
    lat: number;
    lng: number;
    category: 'Eye Hospital' | 'Clinic' | 'General Hospital' | 'Multi-speciality' | 'Government Hospital';
}

export interface ForecastPoint {
    time: string;
    inflow: number;
    baseline: number;
}

export interface OperationsInsight {
    title: string;
    value: string;
    delta: string;
    tone: 'emerald' | 'amber' | 'sky';
}

export type BedStatus = 'available' | 'occupied' | 'reserved' | 'icu' | 'ventilator' | 'discharge' | 'isolation' | 'cleaning';

export interface BedSlot {
    id: string;
    label: string;
    ward: 'ICU Ward' | 'General Ward' | 'Emergency Ward';
    status: BedStatus;
    patientName?: string;
    waitLabel?: string;
}

const DISTRICT_POPULARITY: Record<string, number> = {
    Madurai: 1.45,
    Virudhunagar: 1.08,
    Srivilliputhur: 0.84,
    Krishnankoil: 0.72,
};

const doctorNames = [
    'Dr. Arjun Kumar',
    'Dr. Meera Iyer',
    'Dr. Vikram Rao',
    'Dr. Nandini Shah',
    'Dr. Sanjay Menon',
    'Dr. Priya Nair',
    'Dr. Karthik Subramanian',
    'Dr. Ananya Das',
    'Dr. Raghav Patel',
    'Dr. Fatima Khan',
    'Dr. Srinivasan K',
    'Dr. Aishwarya Balan',
    'Dr. Hari Prasad',
    'Dr. Lavanya S',
    'Dr. Mohanraj V',
    'Dr. Sowmya R',
    'Dr. Naveen Selvam',
    'Dr. Ram Prakash',
    'Dr. Balaji Kumar',
    'Dr. Keerthi Anand',
];

const hospitalNames = [
    'Government Hospital Srivilliputhur',
    'Sri Meenakshi Hospital',
    'Sree Devi Hospital',
    'KVT Hospital',
    'Virudhunagar Government Medical College Hospital',
    'Government Hospital Virudhunagar',
    'Meenakshi Hospital Virudhunagar',
    'Vadamalayan Hospital Virudhunagar',
    'Shanmuganathan Hospital',
    'Government Rajaji Hospital Madurai',
    'Meenakshi Mission Hospital & Research Centre',
    'Apollo Speciality Hospitals Madurai',
    'Vadamalayan Hospitals Madurai',
    'Velammal Medical College Hospital',
    'Devadoss Multispeciality Hospital',
    'Sundaram Medical Foundation Madurai',
    'Government Hospital Krishnankoil',
    'Meenakshi Hospital Krishnankoil',
    'Aravind Eye Hospital Madurai',
    'Aachi Hospital Krishnankoil',
];

const specialties = [
    'General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology',
    'Gynecology', 'Emergency', 'Ophthalmology', 'Surgery', 'Pulmonology',
    'Trauma Care', 'Nephrology', 'Dermatology', 'Oncology', 'Urology',
    'ENT', 'General Medicine', 'Surgery', 'Ophthalmology', 'General Medicine',
];

const districts = [
    'Srivilliputhur', 'Srivilliputhur', 'Srivilliputhur', 'Srivilliputhur', 'Virudhunagar',
    'Virudhunagar', 'Virudhunagar', 'Virudhunagar', 'Virudhunagar', 'Madurai',
    'Madurai', 'Madurai', 'Madurai', 'Madurai', 'Madurai',
    'Madurai', 'Krishnankoil', 'Krishnankoil', 'Madurai', 'Krishnankoil',
];

const addresses = [
    'Main Road, Srivilliputhur, Virudhunagar District',
    'Thiruthangal Road, Srivilliputhur',
    'Rajapalayam Road, Srivilliputhur',
    'Watrap Road, Srivilliputhur',
    'Medical College Road, Virudhunagar',
    'Hospital Road, Virudhunagar',
    'Sivakasi Road, Virudhunagar',
    'Madurai Road, Virudhunagar',
    'South Car Street, Virudhunagar',
    'Panagal Road, Madurai - 625020',
    'Lake Area, Melur Road, Madurai - 625107',
    'KK Nagar, Madurai - 625020',
    'Simmakkal, Madurai - 625001',
    'Anuppanadi, Madurai - 625009',
    'Gorimedu, Madurai - 625007',
    'Anna Nagar, Madurai - 625020',
    'Main Road, Krishnankoil, Virudhunagar District',
    'Srivilliputhur Road, Krishnankoil - 626190',
    'Anna Nagar, Madurai - 625020',
    'Virudhunagar Road, Krishnankoil',
];

const categories: OperationsHospital['category'][] = [
    'Government Hospital',
    'Clinic',
    'Clinic',
    'Clinic',
    'Government Hospital',
    'Government Hospital',
    'Multi-speciality',
    'Multi-speciality',
    'Clinic',
    'Government Hospital',
    'Multi-speciality',
    'Multi-speciality',
    'Multi-speciality',
    'Government Hospital',
    'Multi-speciality',
    'Clinic',
    'Government Hospital',
    'Clinic',
    'Eye Hospital',
    'Clinic',
];

const coordinates: Array<[number, number]> = [
    [9.5120, 77.6340],
    [9.5085, 77.6295],
    [9.5155, 77.6380],
    [9.5045, 77.6310],
    [9.5855, 77.9575],
    [9.5870, 77.9610],
    [9.5840, 77.9530],
    [9.5890, 77.9550],
    [9.5825, 77.9580],
    [9.9238, 78.1345],
    [9.9475, 78.1638],
    [9.8732, 78.1130],
    [9.9190, 78.1260],
    [9.8878, 78.1520],
    [9.9310, 78.1200],
    [9.9350, 78.1450],
    [9.6819, 77.7563],
    [9.6845, 77.7530],
    [9.9270, 78.1190],
    [9.6790, 77.7590],
];

const nearActualBedOverrides: Record<string, number> = {
    'Government Rajaji Hospital Madurai': 2600,
    'Meenakshi Mission Hospital & Research Centre': 750,
    'Apollo Speciality Hospitals Madurai': 320,
    'Velammal Medical College Hospital': 900,
    'Aravind Eye Hospital Madurai': 450,
    'Virudhunagar Government Medical College Hospital': 650,
    'Government Hospital Virudhunagar': 300,
    'Government Hospital Srivilliputhur': 180,
    'Government Hospital Krishnankoil': 160,
};

const categoryBaseBeds: Record<OperationsHospital['category'], number> = {
    'Government Hospital': 260,
    'Multi-speciality': 220,
    'General Hospital': 180,
    Clinic: 90,
    'Eye Hospital': 210,
};

const categoryVentilatorRate: Record<OperationsHospital['category'], number> = {
    'Government Hospital': 0.06,
    'Multi-speciality': 0.07,
    'General Hospital': 0.06,
    Clinic: 0.04,
    'Eye Hospital': 0.035,
};

const categoryStaffRate: Record<OperationsHospital['category'], number> = {
    'Government Hospital': 0.22,
    'Multi-speciality': 0.2,
    'General Hospital': 0.19,
    Clinic: 0.17,
    'Eye Hospital': 0.18,
};

function seededValue(index: number, base: number, spread: number): number {
    const x = Math.sin((index + 1) * 91.7) * 10000;
    return base + Math.round((x - Math.floor(x)) * spread);
}

function roundToNearestFive(value: number): number {
    return Math.max(20, Math.round(value / 5) * 5);
}

function resolveTotalBeds(hospitalName: string, district: string, category: OperationsHospital['category'], index: number): number {
    const override = nearActualBedOverrides[hospitalName];
    if (override) {
        return override;
    }

    const popularity = DISTRICT_POPULARITY[district] ?? 1;
    const drift = 0.9 + ((index % 3) * 0.08);
    const estimated = categoryBaseBeds[category] * popularity * drift;
    return roundToNearestFive(estimated);
}

export const operationsRoster: OperationsHospital[] = hospitalNames.map((hospitalName, index) => {
    const category = categories[index];
    const district = districts[index];
    const totalBeds = resolveTotalBeds(hospitalName, district, category, index);
    const occupiedBeds = Math.min(totalBeds - 4, seededValue(index, Math.floor(totalBeds * 0.6), Math.max(8, Math.floor(totalBeds * 0.15))));

    const totalVentilators = Math.max(
        category === 'Clinic' ? 2 : 4,
        Math.round(totalBeds * categoryVentilatorRate[category])
    );
    const ventilatorsAvailable = Math.max(0, totalVentilators - seededValue(index + 3, Math.floor(totalVentilators * 0.42), Math.max(1, Math.floor(totalVentilators * 0.28))));

    const staffOnDuty = Math.max(
        8,
        Math.round(totalBeds * categoryStaffRate[category])
    );
    const [lat, lng] = coordinates[index];

    return {
        id: `ops-${index + 1}`,
        doctorName: doctorNames[index],
        hospitalName,
        specialty: specialties[index],
        district,
        address: addresses[index],
        totalBeds,
        occupiedBeds,
        totalVentilators,
        ventilatorsAvailable,
        staffOnDuty,
        patientLoad: Math.round((occupiedBeds / totalBeds) * 100),
        lat,
        lng,
        category,
    };
});

export function resolveHospitalForDoctor(hospitalName?: string): OperationsHospital {
    if (!hospitalName) {
        return operationsRoster[0];
    }

    const normalized = hospitalName.trim().toLowerCase();
    const exact = operationsRoster.find((item) => item.hospitalName.trim().toLowerCase() === normalized);
    if (exact) return exact;

    const fuzzy = operationsRoster.find((item) => {
        const candidate = item.hospitalName.toLowerCase();
        return candidate.includes(normalized) || normalized.includes(candidate);
    });

    return fuzzy || operationsRoster[0];
}

function normalizeText(value?: string): string {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function textContainsEither(a?: string, b?: string): boolean {
    const x = normalizeText(a);
    const y = normalizeText(b);
    if (!x || !y) return false;
    return x.includes(y) || y.includes(x);
}

function stableHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function resolveHospitalForDoctorProfile(input: {
    hospitalName?: string;
    doctorName?: string;
    specialty?: string;
    hospitalLocation?: string;
}): OperationsHospital {
    const { hospitalName, doctorName, specialty, hospitalLocation } = input;

    const byHospital = resolveHospitalForDoctor(hospitalName);
    if (hospitalName && byHospital) {
        const requested = normalizeText(hospitalName);
        const resolved = normalizeText(byHospital.hospitalName);
        if (requested && (requested === resolved || resolved.includes(requested) || requested.includes(resolved))) {
            return byHospital;
        }
    }

    const byDoctor = operationsRoster.find((item) => textContainsEither(item.doctorName, doctorName));
    if (byDoctor) {
        return byDoctor;
    }

    const byLocationAndSpecialty = operationsRoster.find((item) => {
        const locationMatch = textContainsEither(item.district, hospitalLocation) || textContainsEither(item.address, hospitalLocation);
        const specialtyMatch = textContainsEither(item.specialty, specialty);
        return locationMatch && specialtyMatch;
    });
    if (byLocationAndSpecialty) {
        return byLocationAndSpecialty;
    }

    const byLocation = operationsRoster.find((item) => {
        return textContainsEither(item.district, hospitalLocation) || textContainsEither(item.address, hospitalLocation);
    });
    if (byLocation) {
        return byLocation;
    }

    const identitySeed = [hospitalName, doctorName, specialty, hospitalLocation]
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .join('|');

    if (identitySeed) {
        const index = stableHash(identitySeed) % operationsRoster.length;
        return operationsRoster[index];
    }

    return operationsRoster[0];
}

export function buildForecastSeries(): ForecastPoint[] {
    const now = new Date();
    const points: ForecastPoint[] = [];
    const isApril = now.getMonth() === 3;
    const festivalSpike = isApril ? 24 : 12;
    const rainFactor = isApril ? 10 : 6;

    for (let hourOffset = 0; hourOffset < 48; hourOffset += 2) {
        const labelDate = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
        const hour = labelDate.getHours();
        const timeLabel = `${String(labelDate.getHours()).padStart(2, '0')}:00`;
        const baseline = 46 + (hour >= 7 && hour <= 11 ? 10 : hour >= 17 && hour <= 21 ? 8 : 0);
        const festivalImpact = isApril && hour >= 16 && hour <= 22 ? festivalSpike : 0;
        const rainImpact = hour >= 15 && hour <= 23 ? rainFactor : 0;
        const trendLift = hourOffset > 24 ? 6 : 0;

        points.push({
            time: timeLabel,
            baseline,
            inflow: baseline + festivalImpact + rainImpact + trendLift,
        });
    }

    return points;
}

export function getOperationsInsights(): OperationsInsight[] {
    return [
        { title: 'Current Bed Occupancy', value: '68%', delta: '+4% since morning', tone: 'amber' },
        { title: 'Ventilators Ready', value: '124', delta: '+9 in last sync', tone: 'sky' },
        { title: 'Staff Coverage', value: '1:5.8', delta: 'Stable for day shift', tone: 'emerald' },
    ];
}

function seededPick<T>(seed: number, values: T[]): T {
    const x = Math.sin(seed * 147.13) * 10000;
    const idx = Math.floor((x - Math.floor(x)) * values.length);
    return values[Math.max(0, Math.min(values.length - 1, idx))];
}

export function buildBedLayout(hospitalId: string): BedSlot[] {
    const patientNames = [
        'Rithik Kumar', 'Anbu Selvan', 'Kavin Raj', 'Meena Lakshmi',
        'Sathya Priya', 'Harini Devi', 'Arun Kumar', 'Bharath Kumar',
        'Pavithra R', 'Gokul N', 'Vijay Anand', 'Nila M',
    ];
    const statuses: BedStatus[] = ['available', 'occupied', 'reserved', 'icu', 'ventilator', 'discharge', 'isolation', 'cleaning'];
    const wards: Array<'ICU Ward' | 'General Ward' | 'Emergency Ward'> = ['ICU Ward', 'General Ward', 'Emergency Ward'];
    const base = Number(hospitalId.replace('ops-', '')) || 1;
    const hospital = operationsRoster.find((item) => item.id === hospitalId) || operationsRoster[0];
    const totalVisualBeds = Math.max(24, Math.min(42, Math.round(hospital.totalBeds / 18)));
    const occupiedTarget = Math.round(totalVisualBeds * (hospital.occupiedBeds / hospital.totalBeds));
    const beds: BedSlot[] = [];

    const weightedStatuses: BedStatus[] = [
        ...Array(Math.max(1, occupiedTarget - 6)).fill('occupied'),
        ...Array(Math.max(1, Math.round(occupiedTarget * 0.15))).fill('icu'),
        ...Array(Math.max(1, Math.round(occupiedTarget * 0.1))).fill('ventilator'),
        ...Array(Math.max(1, Math.round(totalVisualBeds * 0.12))).fill('reserved'),
        ...Array(Math.max(1, Math.round(totalVisualBeds * 0.08))).fill('discharge'),
        ...Array(Math.max(1, Math.round(totalVisualBeds * 0.05))).fill('isolation'),
        ...Array(Math.max(1, Math.round(totalVisualBeds * 0.06))).fill('cleaning'),
        ...Array(Math.max(3, totalVisualBeds - occupiedTarget)).fill('available'),
    ];

    for (let i = 1; i <= totalVisualBeds; i += 1) {
        const seed = base * 100 + i;
        let status = seededPick(seed, weightedStatuses);
        if (i % 4 === 0) status = 'available';
        if (i % 7 === 0) status = 'occupied';
        const ward = wards[(i + base) % wards.length];
        const patientName = status === 'occupied' || status === 'icu' || status === 'ventilator'
            ? seededPick(seed + 3, patientNames)
            : undefined;

        beds.push({
            id: `${hospitalId}-bed-${i}`,
            label: `Bed ${String(i).padStart(3, '0')}`,
            ward,
            status,
            patientName,
            waitLabel: patientName ? `${(seed % 11) + 1}h ago` : undefined,
        });
    }

    return beds;
}
