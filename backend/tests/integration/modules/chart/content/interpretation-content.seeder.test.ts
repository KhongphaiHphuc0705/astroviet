import { PrismaClient } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';

import { enumerateMvpInterpretationSubjects } from '../../../../../src/modules/chart/domain/interpretation/enumerate-mvp-subjects.js';
import { InterpretationContentFile } from '../../../../../src/modules/chart/infrastructure/content/interpretation-content-file.schema.js';
import {
  seedInterpretationContent,
  ContentSeedPrerequisiteError,
  ContentSeedConflictError,
} from '../../../../../src/modules/chart/infrastructure/content/interpretation-content.seeder.js';
import { PrismaInterpretationContentProvider } from '../../../../../src/modules/chart/infrastructure/repositories/prisma-interpretation-content.provider.js';
import { DatabaseTestHelper } from '../../../../helpers/database.helper.js';

describe('Interpretation Content Pipeline (Integration)', () => {
  let prisma: PrismaClient;
  let dbHelper: DatabaseTestHelper;
  let provider: PrismaInterpretationContentProvider;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    dbHelper = new DatabaseTestHelper(prisma);
    provider = new PrismaInterpretationContentProvider(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  const getFullFixture = (
    status: 'Draft' | 'Published' = 'Published',
    version: string = '1.0',
  ): InterpretationContentFile => {
    const subjects = enumerateMvpInterpretationSubjects();
    return {
      language: 'vi',
      version,
      status,
      contentSource: 'HumanAuthored',
      items: subjects.map((s) => ({
        subjectType: s.subjectType,
        subjectKey: s.subjectKey,
        bodyText: `test:${s.subjectKey}`,
      })),
    };
  };

  describe('Seeder and Provider Interactions', () => {
    it('should seed Published file and provider should return all 252 subjects', async () => {
      const file = getFullFixture('Published', '1.0');
      const seedResult = await seedInterpretationContent(prisma, file);

      expect(seedResult.outcome).toBe('inserted');
      expect(seedResult.count).toBe(252);

      const subjectsToLookup = file.items.map((i) => ({
        subjectType: i.subjectType as any,
        subjectKey: i.subjectKey,
      }));

      const contents = await provider.findPublishedContents('vi', '1.0', subjectsToLookup);
      expect(contents).toHaveLength(252);

      const versions = await provider.findPublishedVersions('vi');
      expect(versions).toContain('1.0');
    });

    it('should lookup accurately by subject type/key for 3 representative subjects', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.0'));

      const lookup = [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
        { subjectType: 'PlanetInHouse', subjectKey: 'Venus_in_House_7' },
        { subjectType: 'AngleInSign', subjectKey: 'Ascendant_in_Leo' },
      ];

      const contents = await provider.findPublishedContents('vi', '1.0', lookup as any);
      expect(contents).toHaveLength(3);

      const sun = contents.find((c) => c.subjectKey === 'Sun_in_Leo');
      expect(sun?.bodyText).toBe('test:Sun_in_Leo');

      const venus = contents.find((c) => c.subjectKey === 'Venus_in_House_7');
      expect(venus?.bodyText).toBe('test:Venus_in_House_7');
    });

    it('should return empty for missing language', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.0'));
      const contents = await provider.findPublishedContents('en', '1.0', [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
      ] as any);
      expect(contents).toHaveLength(0);
    });

    it('should return empty for missing version and support multiple versions', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.0'));
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.1'));

      const contentsV2 = await provider.findPublishedContents('vi', '2.0', [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
      ] as any);
      expect(contentsV2).toHaveLength(0);

      const versions = await provider.findPublishedVersions('vi');
      expect(versions).toHaveLength(2);
      expect(versions).toContain('1.0');
      expect(versions).toContain('1.1');
    });

    it('should return empty if status is Draft', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Draft', '1.0'));

      const contents = await provider.findPublishedContents('vi', '1.0', [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
      ] as any);
      expect(contents).toHaveLength(0);

      const versions = await provider.findPublishedVersions('vi');
      expect(versions).toHaveLength(0);
    });

    it('should return unchanged when seeding the exact same file twice', async () => {
      const file = getFullFixture('Draft', '1.0');
      const first = await seedInterpretationContent(prisma, file);
      expect(first.outcome).toBe('inserted');

      const second = await seedInterpretationContent(prisma, file);
      expect(second.outcome).toBe('unchanged');
      expect(second.count).toBe(252);
    });

    it('should replace Draft when seeding a different Draft', async () => {
      const file1 = getFullFixture('Draft', '1.0');
      await seedInterpretationContent(prisma, file1);

      const file2 = getFullFixture('Draft', '1.0');
      file2.items[0].bodyText = 'changed text';

      const result = await seedInterpretationContent(prisma, file2);
      expect(result.outcome).toBe('replaced-draft');
      expect(result.count).toBe(252);
    });

    it('should replace Draft with Published (promotion)', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Draft', '1.0'));

      const file2 = getFullFixture('Published', '1.0');
      const result = await seedInterpretationContent(prisma, file2);
      expect(result.outcome).toBe('replaced-draft');

      const versions = await provider.findPublishedVersions('vi');
      expect(versions).toContain('1.0');
    });

    it('should throw ContentSeedConflictError if trying to overwrite Published with different content', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.0'));

      const file2 = getFullFixture('Published', '1.0');
      file2.items[0].bodyText = 'changed text';

      await expect(seedInterpretationContent(prisma, file2)).rejects.toThrow(
        ContentSeedConflictError,
      );
    });

    it('should throw ContentSeedConflictError if trying to downgrade Published to Draft', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.0'));

      const file2 = getFullFixture('Draft', '1.0');
      file2.items[0].bodyText = 'changed text';

      await expect(seedInterpretationContent(prisma, file2)).rejects.toThrow(
        ContentSeedConflictError,
      );
    });

    it('should throw ContentSeedConflictError on version collision (same semantic, different string)', async () => {
      await seedInterpretationContent(prisma, getFullFixture('Published', '1.0'));

      const file2 = getFullFixture('Published', '1'); // '1' is semantically equal to '1.0'
      await expect(seedInterpretationContent(prisma, file2)).rejects.toThrow(
        ContentSeedConflictError,
      );
    });
  });

  describe('Prerequisites', () => {
    it('should throw ContentSeedPrerequisiteError if language does not exist', async () => {
      // Temporarily remove 'vi'
      await prisma.language.delete({ where: { code: 'vi' } });

      try {
        await expect(
          seedInterpretationContent(prisma, getFullFixture('Draft', '1.0')),
        ).rejects.toThrow(ContentSeedPrerequisiteError);
      } finally {
        // Restore 'vi' for other tests
        await prisma.language.create({
          data: { code: 'vi', display_name: 'Tiếng Việt', is_default: true },
        });
      }
    });
  });
});
