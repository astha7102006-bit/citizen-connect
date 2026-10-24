/**
 * Safe Additive Migration Script for Neon Database
 * Adds departmentId to users table and creates notifications table + enums.
 * Preserves 100% of existing data without resetting or dropping anything.
 */

import { prisma, disconnectDatabase } from '../config/db.js';

export async function applySafeMigration() {
  console.log('Running safe additive migration...');

  // 1. Add departmentId column to users if not exists
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
  `);
  console.log('✓ users.departmentId column verified');

  // Add foreign key constraint if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_departmentId_fkey'
      ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" 
        FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  console.log('✓ users_departmentId_fkey constraint verified');

  // Add index on users(departmentId)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "users_departmentId_idx" ON "users"("departmentId");
  `);
  console.log('✓ users_departmentId_idx verified');

  // 2. Create NotificationType enum if not exists
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        CREATE TYPE "NotificationType" AS ENUM ('STATUS_CHANGE', 'OFFICIAL_RESPONSE', 'TRANSFER', 'ESCALATION', 'SYSTEM');
      END IF;
    END $$;
  `);
  console.log('✓ NotificationType enum verified');

  // 3. Create notifications table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "complaintId" TEXT,
      "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "metadata" JSONB,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log('✓ notifications table verified');

  // Add indexes for notifications
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
  `);
  console.log('✓ notifications indexes verified');

  console.log('✓ Safe additive migration completed successfully!');
}

if (process.argv[1]?.includes('applySafeMigration.js')) {
  applySafeMigration()
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
}
