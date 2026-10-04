/* eslint-disable no-console */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';

import { PrismaClient } from '@prisma/client';

import { seedInterpretationContent } from '../src/modules/chart/infrastructure/content/interpretation-content.seeder.js';
import { validateInterpretationContentText } from '../src/modules/chart/infrastructure/content/interpretation-content.validator.js';

async function main() {
  const { values } = parseArgs({
    options: {
      file: {
        type: 'string',
        default: 'prisma/content/interpretations.vi.json',
      },
      'validate-only': {
        type: 'boolean',
        default: false,
      },
    },
  });

  const filePath = path.resolve(process.cwd(), values.file as string);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    console.error(
      'Note: Production content (interpretations.vi.json) is a Content Owner dependency and is not checked into the repository.',
    );
    console.error(
      'You can test with the sample file: npm run prisma:seed:content -- --file prisma/content/interpretations.vi.sample.json',
    );
    process.exit(1);
  }

  console.log(`Reading content from: ${filePath}`);
  const text = fs.readFileSync(filePath, 'utf8');

  console.log('Validating content...');
  const validationResult = validateInterpretationContentText(text);

  if (!validationResult.ok) {
    console.error('Validation failed!');
    console.error(
      `Coverage: ${validationResult.coverage?.present || 0}/${validationResult.coverage?.expected || 252} present.`,
    );

    // Group issues by code
    const issueMap = new Map<string, number>();
    validationResult.issues.forEach((i) => {
      issueMap.set(i.code, (issueMap.get(i.code) || 0) + 1);
    });

    console.error('Issue Summary:');
    issueMap.forEach((count, code) => {
      console.error(`- ${code}: ${count} occurrences`);
    });

    console.error('\nTop 5 specific issues:');
    validationResult.issues.slice(0, 5).forEach((i) => {
      console.error(`- [${i.code}] ${i.path ? `at ${i.path}: ` : ''}${i.message}`);
    });

    if (validationResult.issues.length > 5) {
      console.error(`...and ${validationResult.issues.length - 5} more issues.`);
    }

    process.exit(1);
  }

  console.log('Validation passed!');
  console.log(
    `Coverage: ${validationResult.coverage!.present}/${validationResult.coverage!.expected}`,
  );

  if (values['validate-only']) {
    console.log('Validate-only mode active. Skipping database seed.');
    process.exit(0);
  }

  console.log('Connecting to database...');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Seeding content to database...');
    const seedResult = await seedInterpretationContent(prisma, validationResult.file!);

    console.log(`Seed successful! Outcome: ${seedResult.outcome}, Count: ${seedResult.count}`);
  } catch (error: unknown) {
    console.error('Error seeding content:');
    if (
      error instanceof Error &&
      (error.name === 'ContentSeedPrerequisiteError' || error.name === 'ContentSeedConflictError')
    ) {
      console.error(`[${error.name}] ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Unhandled execution error:', error);
  process.exit(1);
});
