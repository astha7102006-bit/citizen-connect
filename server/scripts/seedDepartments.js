/**
 * CitizenConnect — Seed Canonical Public Departments (Idempotent)
 *
 * Populates official Indian public service departments into PostgreSQL.
 * Uses upsert on unique `code` so it's completely safe to run repeatedly.
 */

import { prisma, disconnectDatabase } from '../config/db.js';

const DEPARTMENTS = [
  {
    code: 'MCD',
    name: 'Municipal Corporation & Civic Services',
    description: 'Civic maintenance, building bylaws, sanitation, local infrastructure and zonal administration.',
    contactEmail: 'grievance@mcd.gov.in',
    contactPhone: '+91-11-23225501',
    officeLocation: 'Civic Centre, Minto Road, New Delhi',
    slaDaysLevel1: 7,
    slaDaysLevel2: 15,
    slaDaysLevel3: 30,
  },
  {
    code: 'PWD',
    name: 'Public Works Department (PWD)',
    description: 'Roads, bridges, flyovers, public drainage networks and government building infrastructure.',
    contactEmail: 'complaints@pwd.gov.in',
    contactPhone: '+91-11-23314412',
    officeLocation: 'MSO Building, IP Estate, New Delhi',
    slaDaysLevel1: 7,
    slaDaysLevel2: 14,
    slaDaysLevel3: 28,
  },
  {
    code: 'REV',
    name: 'Revenue & Land Administration',
    description: 'Land records, registry, mutations, tehsildar administration and stamp duties.',
    contactEmail: 'revenue.redressal@gov.in',
    contactPhone: '+91-11-23951234',
    officeLocation: 'Divisional Commissioner Office, 5 Sham Nath Marg',
    slaDaysLevel1: 10,
    slaDaysLevel2: 20,
    slaDaysLevel3: 30,
  },
  {
    code: 'DISCOM',
    name: 'Electricity & Power Distribution (DISCOM)',
    description: 'Power distribution, billing grievances, transformer maintenance and electrical safety.',
    contactEmail: 'powerhelp@discom.gov.in',
    contactPhone: '19123',
    officeLocation: 'Power Distribution Operations HQ, Pragati Maidan',
    slaDaysLevel1: 5,
    slaDaysLevel2: 10,
    slaDaysLevel3: 20,
  },
  {
    code: 'WSSB',
    name: 'Water Supply & Sewerage Board',
    description: 'Potable water distribution, pipeline repairs, contamination complaints and sewer networks.',
    contactEmail: 'watercomplaints@jalboard.gov.in',
    contactPhone: '1916',
    officeLocation: 'Varunalaya Phase-II, Karol Bagh',
    slaDaysLevel1: 5,
    slaDaysLevel2: 12,
    slaDaysLevel3: 25,
  },
  {
    code: 'RTO',
    name: 'Transport & Traffic Authority (RTO)',
    description: 'Vehicle registration, driving licenses, commercial fitness certificates and public transit regulation.',
    contactEmail: 'transport.grievance@gov.in',
    contactPhone: '+91-11-23992233',
    officeLocation: '5/9 Under Hill Road, Civil Lines',
    slaDaysLevel1: 7,
    slaDaysLevel2: 14,
    slaDaysLevel3: 30,
  },
  {
    code: 'POL',
    name: 'Police & Law Enforcement Oversight',
    description: 'Police complaints authority, vigilance review, non-registration of FIRs and procedural misconduct.',
    contactEmail: 'vigilance-police@gov.in',
    contactPhone: '112',
    officeLocation: 'Police Headquarters, Jai Singh Road',
    slaDaysLevel1: 7,
    slaDaysLevel2: 15,
    slaDaysLevel3: 30,
  },
  {
    code: 'HFW',
    name: 'Health & Family Welfare',
    description: 'Civil hospitals, primary healthcare clinics, medical negligence review and medicine availability.',
    contactEmail: 'health.grievance@gov.in',
    contactPhone: '+91-11-22307140',
    officeLocation: 'Swasthya Bhawan, IP Extension',
    slaDaysLevel1: 3,
    slaDaysLevel2: 7,
    slaDaysLevel3: 15,
  },
  {
    code: 'EDU',
    name: 'Education & Universities',
    description: 'Government school infrastructure, admissions under RTE, teacher absenteeism and university grievance cells.',
    contactEmail: 'education.ombudsman@gov.in',
    contactPhone: '+91-11-23890040',
    officeLocation: 'Directorate of Education, Old Secretariat',
    slaDaysLevel1: 7,
    slaDaysLevel2: 15,
    slaDaysLevel3: 30,
  },
  {
    code: 'PDS',
    name: 'Consumer Affairs & Food Supplies (PDS)',
    description: 'Fair price ration shops, weight/measure fraud, essential commodity distribution and consumer rights.',
    contactEmail: 'foodsupply.redressal@gov.in',
    contactPhone: '1967',
    officeLocation: 'K-Block, Vikas Bhawan, IP Estate',
    slaDaysLevel1: 5,
    slaDaysLevel2: 10,
    slaDaysLevel3: 20,
  },
];

export async function seedDepartments() {
  console.log('Seeding canonical departments...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        description: dept.description,
        contactEmail: dept.contactEmail,
        contactPhone: dept.contactPhone,
        officeLocation: dept.officeLocation,
        slaDaysLevel1: dept.slaDaysLevel1,
        slaDaysLevel2: dept.slaDaysLevel2,
        slaDaysLevel3: dept.slaDaysLevel3,
        isActive: true,
      },
      create: dept,
    });
  }
  const count = await prisma.department.count();
  console.log(`✓ Departments seeded successfully. Total in database: ${count}`);
}

// Allow direct CLI execution: node server/scripts/seedDepartments.js
if (process.argv[1]?.includes('seedDepartments.js')) {
  seedDepartments()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
}
