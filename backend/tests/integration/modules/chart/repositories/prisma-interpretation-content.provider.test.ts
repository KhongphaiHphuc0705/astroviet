import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InterpretationContentRecord } from '../../../../../src/modules/chart/domain/types/interpretation.types.js';
import { PrismaInterpretationContentProvider } from '../../../../../src/modules/chart/infrastructure/repositories/prisma-interpretation-content.provider.js';
import { InfrastructureError } from '../../../../../src/shared/errors/app-error.js';
import { DatabaseTestHelper } from '../../../../helpers/database.helper.js';

describe('PrismaInterpretationContentProvider', () => {
  const prisma = new PrismaClient();
  const dbHelper = new DatabaseTestHelper(prisma);
  const provider = new PrismaInterpretationContentProvider(prisma);

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  const fixture1: InterpretationContentRecord = {
    subjectType: 'PlanetInSign',
    subjectKey: 'Sun_in_Leo',
    language: 'vi',
    version: '1.0',
    status: 'Published',
    tone: null,
    bodyText: 'Sun in Leo text',
    contentSource: 'HumanAuthored',
  };

  const fixture2: InterpretationContentRecord = {
    subjectType: 'PlanetInHouse',
    subjectKey: 'Sun_in_House_7',
    language: 'vi',
    version: '1.0',
    status: 'Published',
    tone: null,
    bodyText: 'Sun in House 7 text',
    contentSource: 'HumanAuthored',
  };

  const fixture3: InterpretationContentRecord = {
    subjectType: 'AngleInSign',
    subjectKey: 'Ascendant_in_Leo',
    language: 'vi',
    version: '2.0',
    status: 'Published',
    tone: null,
    bodyText: 'Ascendant in Leo text',
    contentSource: 'HumanAuthored',
  };

  describe('Constraints Check', () => {
    it('should reject invalid subject_type', async () => {
      const invalid = { ...fixture1, subjectType: 'InvalidType' as any };
      await expect(provider.insertMany([invalid])).rejects.toThrow(InfrastructureError);
    });

    it('should accept AngleInSign subject_type', async () => {
      await expect(provider.insertMany([fixture3])).resolves.not.toThrow();
    });

    it('should reject invalid content_source', async () => {
      const invalid = { ...fixture1, contentSource: 'InvalidSource' as any };
      await expect(provider.insertMany([invalid])).rejects.toThrow(InfrastructureError);
    });

    it('should reject invalid status', async () => {
      const invalid = { ...fixture1, status: 'InvalidStatus' as any };
      await expect(provider.insertMany([invalid])).rejects.toThrow(InfrastructureError);
    });

    it('should reject invalid language (FK)', async () => {
      const invalid = { ...fixture1, language: 'en' };
      await expect(provider.insertMany([invalid])).rejects.toThrow(InfrastructureError);
    });

    it('should reject duplicate (type, key, language, version) when tone is null due to COALESCE', async () => {
      await provider.insertMany([fixture1]);
      const duplicate = { ...fixture1 }; // same tone: null
      await expect(provider.insertMany([duplicate])).rejects.toThrow(InfrastructureError);
    });

    it('should accept same key if tone is different', async () => {
      await provider.insertMany([fixture1]);
      const diffTone = { ...fixture1, tone: 'Encouraging' as const };
      await expect(provider.insertMany([diffTone])).resolves.not.toThrow();
    });
  });

  describe('findPublishedVersions()', () => {
    it('should return distinct published versions', async () => {
      await provider.insertMany([
        fixture1,
        fixture2,
        fixture3,
        { ...fixture1, subjectKey: 'Moon_in_Leo', status: 'Draft' },
      ]);
      const versions = await provider.findPublishedVersions('vi');
      expect(versions).toHaveLength(2);
      expect(versions).toContain('1.0');
      expect(versions).toContain('2.0');
    });

    it('should return empty array if no data', async () => {
      const versions = await provider.findPublishedVersions('vi');
      expect(versions).toHaveLength(0);
    });
  });

  describe('findPublishedContents()', () => {
    it('should return published contents matching language, version, and subjects', async () => {
      await provider.insertMany([fixture1, fixture2, fixture3]);
      const contents = await provider.findPublishedContents('vi', '1.0', [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
        { subjectType: 'AngleInSign', subjectKey: 'Ascendant_in_Leo' }, // different version, won't be returned
      ]);
      expect(contents).toHaveLength(1);
      expect(contents[0].subjectKey).toBe('Sun_in_Leo');
    });

    it('should exclude Draft or Archived status', async () => {
      await provider.insertMany([{ ...fixture1, status: 'Draft' }]);
      const contents = await provider.findPublishedContents('vi', '1.0', [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
      ]);
      expect(contents).toHaveLength(0);
    });

    it('should exclude rows with tone', async () => {
      await provider.insertMany([{ ...fixture1, tone: 'Encouraging' }]);
      const contents = await provider.findPublishedContents('vi', '1.0', [
        { subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Leo' },
      ]);
      expect(contents).toHaveLength(0);
    });

    it('should return empty array if subjects is empty', async () => {
      await provider.insertMany([fixture1]);
      const contents = await provider.findPublishedContents('vi', '1.0', []);
      expect(contents).toHaveLength(0);
    });
  });

  describe('Failure Semantics', () => {
    it('should throw InfrastructureError on db failure (stub)', async () => {
      const fakePrisma = {
        interpretationContent: {
          findMany: vi.fn().mockRejectedValue(new Error('DB failure')),
        },
      } as unknown as PrismaClient;
      const fakeProvider = new PrismaInterpretationContentProvider(fakePrisma);

      await expect(fakeProvider.findPublishedVersions('vi')).rejects.toThrow(InfrastructureError);
      await expect(
        fakeProvider.findPublishedContents('vi', '1.0', [
          { subjectType: 'PlanetInSign', subjectKey: 'Sun' },
        ]),
      ).rejects.toThrow(InfrastructureError);
    });
  });

  describe('Language seed & helper', () => {
    it('should retain vi in languages after clearDatabase()', async () => {
      const viLang = await prisma.language.findUnique({ where: { code: 'vi' } });
      expect(viLang).not.toBeNull();
    });
  });
});
