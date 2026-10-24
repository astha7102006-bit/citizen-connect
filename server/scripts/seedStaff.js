/**
 * CitizenConnect — Seed Canonical Staff & Official Accounts (Idempotent)
 *
 * Seeds baseline administrative, reviewer, and departmental official accounts
 * into PostgreSQL using bcrypt password hashing.
 * Safe to execute repeatedly (uses upsert on unique email).
 */

import bcrypt from 'bcryptjs';
import { prisma, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';

export const STAFF_SEEDS = [
  {
    email: 'official@citizenconnect.gov.in',
    name: 'Shri R. K. Sharma (Deputy Commissioner)',
    role: 'OFFICIAL',
    phone: '+91-11-23225501',
    password: 'StaffPassword123!',
    departmentCode: 'MCD',
  },
  {
    email: 'reviewer@citizenconnect.gov.in',
    name: 'Justice S. N. Hegde (State Lokayukta)',
    role: 'REVIEWER',
    phone: '+91-11-23951234',
    password: 'StaffPassword123!',
  },
  {
    email: 'admin@citizenconnect.gov.in',
    name: 'Platform Administrator',
    role: 'ADMIN',
    phone: '+91-11-23314412',
    password: 'StaffPassword123!',
  },
];

export async function seedStaffAccounts() {
  console.log('Seeding canonical staff & official accounts into database...');
  const seeded = [];

  for (const staff of STAFF_SEEDS) {
    const passwordHash = await bcrypt.hash(staff.password, env.BCRYPT_ROUNDS || 12);

    let departmentId = null;
    if (staff.departmentCode) {
      const dept = await prisma.department.findUnique({
        where: { code: staff.departmentCode },
      });
      if (dept) {
        departmentId = dept.id;
      }
    }

    const user = await prisma.user.upsert({
      where: { email: staff.email.toLowerCase() },
      update: {
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        departmentId,
        accountStatus: 'ACTIVE',
      },
      create: {
        email: staff.email.toLowerCase(),
        name: staff.name,
        passwordHash,
        role: staff.role,
        phone: staff.phone,
        departmentId,
        accountStatus: 'ACTIVE',
      },
    });

    seeded.push({ email: user.email, role: user.role, name: user.name, departmentId: user.departmentId });
    console.log(`  ✓ [${user.role}] ${user.name} (${user.email}) seeded (dept: ${staff.departmentCode || 'ALL'}).`);
  }

  return seeded;
}

// Execute directly if run as main script
if (process.argv[1]?.endsWith('seedStaff.js')) {
  seedStaffAccounts()
    .then(() => {
      console.log('Staff accounts seeding completed successfully.');
      return disconnectDatabase();
    })
    .catch((err) => {
      console.error('Failed to seed staff accounts:', err);
      process.exit(1);
    });
}
