import { PrismaClient, Prisma, InterpretationContent } from '@prisma/client';

import { InfrastructureError } from '../../../../shared/errors/app-error.js';
import { compareContentVersion } from '../../domain/interpretation/content-version.js';

import { InterpretationContentFile } from './interpretation-content-file.schema.js';

export class ContentSeedPrerequisiteError extends InfrastructureError {
  constructor(message: string) {
    super(message, { type: 'PREREQUISITE_FAILED' });
    this.name = 'ContentSeedPrerequisiteError';
  }
}

export class ContentSeedConflictError extends InfrastructureError {
  constructor(message: string) {
    super(message, { type: 'SEED_CONFLICT' });
    this.name = 'ContentSeedConflictError';
  }
}

export type SeedOutcome = 'inserted' | 'unchanged' | 'replaced-draft';

export type SeedResult = {
  outcome: SeedOutcome;
  count: number;
};

export async function seedInterpretationContent(
  prisma: Prisma.TransactionClient | PrismaClient,
  file: InterpretationContentFile,
): Promise<SeedResult> {
  const executeSeed = async (tx: Prisma.TransactionClient): Promise<SeedResult> => {
    // 1. Check if language exists
    const lang = await tx.language.findUnique({ where: { code: file.language } });
    if (!lang) {
      throw new ContentSeedPrerequisiteError(
        `Language '${file.language}' does not exist in the database. Please run migrations/seed reference data first.`,
      );
    }

    // 2. Fetch existing rows for this language to check version collision
    const allVersionsInDb = await tx.interpretationContent.findMany({
      where: { language: file.language },
      select: { version: true },
      distinct: ['version'],
    });

    const matchingVersions = allVersionsInDb
      .map((r) => r.version)
      .filter((v) => compareContentVersion(v, file.version) === 0);

    const exactVersionString = file.version;
    const hasDifferentStringButSameSemantic = matchingVersions.some(
      (v) => v !== exactVersionString,
    );

    if (hasDifferentStringButSameSemantic) {
      throw new ContentSeedConflictError(
        `Cannot seed version '${exactVersionString}' because a semantically identical but string-different version exists: ${matchingVersions.filter((v) => v !== exactVersionString).join(', ')}`,
      );
    }

    // Existing rows for EXACT version string
    const existingRows = await tx.interpretationContent.findMany({
      where: {
        language: file.language,
        version: exactVersionString,
        tone: null,
      },
    });

    if (existingRows.length === 0) {
      // Insert all
      await insertAll(tx, file);
      return { outcome: 'inserted', count: file.items.length };
    }

    // Check for Published/Archived
    const hasNonDraft = existingRows.some(
      (r) => r.status === 'Published' || r.status === 'Archived',
    );

    // Are they identical?
    const isIdentical = checkIdentical(existingRows, file);

    if (isIdentical) {
      return { outcome: 'unchanged', count: existingRows.length };
    }

    if (hasNonDraft) {
      throw new ContentSeedConflictError(
        `Cannot overwrite existing Published/Archived content for version '${exactVersionString}'. Please create a new version.`,
      );
    }

    // It is Draft, and not identical -> Replace Draft
    await tx.interpretationContent.deleteMany({
      where: {
        language: file.language,
        version: exactVersionString,
        tone: null,
      },
    });

    await insertAll(tx, file);
    return { outcome: 'replaced-draft', count: file.items.length };
  };

  if ('$transaction' in prisma) {
    return (prisma as PrismaClient).$transaction(executeSeed);
  } else {
    return executeSeed(prisma as Prisma.TransactionClient);
  }
}

async function insertAll(tx: Prisma.TransactionClient, file: InterpretationContentFile) {
  const data = file.items.map((item) => ({
    subject_type: item.subjectType,
    subject_key: item.subjectKey,
    language: file.language,
    version: file.version,
    status: file.status,
    content_source: file.contentSource,
    body_text: item.bodyText,
    tone: null,
  }));

  await tx.interpretationContent.createMany({
    data,
  });
}

function checkIdentical(
  existingRows: InterpretationContent[],
  file: InterpretationContentFile,
): boolean {
  if (existingRows.length !== file.items.length) {
    return false;
  }

  const fileMap = new Map<string, InterpretationContentFile['items'][number]>();
  file.items.forEach((item) => {
    const id = `${item.subjectType}:${item.subjectKey}`;
    fileMap.set(id, item);
  });

  for (const row of existingRows) {
    const id = `${row.subject_type}:${row.subject_key}`;
    const fileItem = fileMap.get(id);
    if (!fileItem) return false;

    if (row.body_text !== fileItem.bodyText) return false;
    if (row.status !== file.status) return false;
    if (row.content_source !== file.contentSource) return false;
  }

  return true;
}
