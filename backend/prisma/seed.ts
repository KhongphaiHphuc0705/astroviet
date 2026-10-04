/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

import { seedInterpretationContent } from '../src/modules/chart/infrastructure/content/interpretation-content.seeder.js';
import { validateInterpretationContentText } from '../src/modules/chart/infrastructure/content/interpretation-content.validator.js';

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

  // Seed interpretation sample
  const samplePath = path.resolve(process.cwd(), 'prisma/content/interpretations.vi.sample.json');
  if (fs.existsSync(samplePath)) {
    console.log('🌱 Seeding interpretation content from sample...');
    try {
      const text = fs.readFileSync(samplePath, 'utf8');
      const validationResult = validateInterpretationContentText(text);
      if (validationResult.ok && validationResult.file) {
        const seedResult = await seedInterpretationContent(prisma, validationResult.file);
        console.log(
          `✅ Sample interpretation content seeded. Outcome: ${seedResult.outcome}, Count: ${seedResult.count}`,
        );
      } else {
        console.error(
          '❌ Failed to validate sample interpretation content. Run prisma:seed:content for details.',
        );
      }
    } catch (e) {
      console.error('❌ Error seeding sample interpretation content:', e);
    }
  } else {
    console.log('⚠️ Sample interpretation content file not found. Skipping.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
