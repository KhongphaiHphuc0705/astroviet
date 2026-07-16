/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

import { seedConfig } from './seed.config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = seedConfig;

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: SEED_ADMIN_EMAIL.toLowerCase() },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user with email ${SEED_ADMIN_EMAIL} already exists. Skipping.`);
    return;
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await hash(SEED_ADMIN_PASSWORD, saltRounds);

  // Insert admin
  const admin = await prisma.user.create({
    data: {
      email: SEED_ADMIN_EMAIL.toLowerCase(),
      password_hash: passwordHash,
      display_name: 'Administrator',
      role: 'admin',
      email_verified_at: new Date(),
    },
  });

  console.log(`✅ Admin user created successfully: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
