import { PrismaClient } from '@prisma/client';

import { InfrastructureError } from '../../../../shared/errors/app-error.js';
import { IInterpretationContentProvider } from '../../domain/ports/interpretation-content-provider.port.js';
import {
  InterpretationContentRecord,
  InterpretationContentSource,
  InterpretationContentStatus,
  InterpretationSubjectRef,
  InterpretationSubjectType,
  InterpretationTone,
} from '../../domain/types/interpretation.types.js';

export class PrismaInterpretationContentProvider implements IInterpretationContentProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublishedVersions(language: string): Promise<string[]> {
    try {
      const records = await this.prisma.interpretationContent.findMany({
        where: {
          language,
          status: 'Published',
        },
        select: {
          version: true,
        },
        distinct: ['version'],
      });
      return records.map((r) => r.version);
    } catch (error) {
      throw new InfrastructureError('Failed to fetch published versions', undefined, error);
    }
  }

  async findPublishedContents(
    language: string,
    version: string,
    subjects: readonly InterpretationSubjectRef[],
  ): Promise<InterpretationContentRecord[]> {
    if (subjects.length === 0) {
      return [];
    }

    try {
      const subjectConditions = subjects.map((s) => ({
        subject_type: s.subjectType,
        subject_key: s.subjectKey,
      }));

      const records = await this.prisma.interpretationContent.findMany({
        where: {
          language,
          version,
          status: 'Published',
          tone: null,
          OR: subjectConditions,
        },
      });

      return records.map((r) => ({
        subjectType: r.subject_type as InterpretationSubjectType,
        subjectKey: r.subject_key,
        language: r.language,
        tone: r.tone as InterpretationTone | null,
        bodyText: r.body_text,
        version: r.version,
        status: r.status as InterpretationContentStatus,
        contentSource: r.content_source as InterpretationContentSource,
      }));
    } catch (error) {
      throw new InfrastructureError('Failed to fetch published contents', undefined, error);
    }
  }

  async insertMany(records: InterpretationContentRecord[]): Promise<void> {
    try {
      await this.prisma.interpretationContent.createMany({
        data: records.map((r) => ({
          subject_type: r.subjectType,
          subject_key: r.subjectKey,
          language: r.language,
          tone: r.tone,
          body_text: r.bodyText,
          version: r.version,
          status: r.status,
          content_source: r.contentSource,
        })),
      });
    } catch (error) {
      throw new InfrastructureError('Failed to insert interpretation contents', undefined, error);
    }
  }
}
