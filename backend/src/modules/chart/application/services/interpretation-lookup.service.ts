import { ILogger } from '../../../../shared/logger/logger.interface.js';
import { Chart } from '../../domain/entities/chart.entity.js';
import {
  compareContentVersion,
  isValidContentVersion,
} from '../../domain/interpretation/content-version.js';
import { deriveInterpretationSubjects } from '../../domain/interpretation/derive-interpretation-subjects.js';
import { IInterpretationContentProvider } from '../../domain/ports/interpretation-content-provider.port.js';
import { InterpretationContentRecord } from '../../domain/types/interpretation.types.js';

// MVP: fixed language (FD10 of M3, D-M4-04)
const INTERPRETATION_LANGUAGE = 'vi';

export type InterpretationChartView = Pick<
  Chart,
  'id' | 'planets' | 'angles' | 'isHouseDataAvailable' | 'snapshotInterpretationVersion'
>;

export interface InterpretationResult {
  /** The version used to look up interpretations, or null if no Published version exists. */
  version: string | null;
  /** Ordered list of content records. Order follows canonical derive order. */
  items: readonly InterpretationContentRecord[];
}

/**
 * Application service: resolves which version of interpretation content to use
 * and looks up content for a given chart.
 *
 * Architecture constraints (FD2):
 * - Imports only ILogger, domain port, and domain types — NO Prisma, Express, or infrastructure.
 * - Does NOT create new error types; infrastructure errors propagate as-is (R3).
 */
export class InterpretationLookupService {
  constructor(
    private readonly contentProvider: IInterpretationContentProvider,
    private readonly logger: ILogger,
  ) {}

  /**
   * Resolves the latest Published version for the fixed language ('vi').
   * Returns null if no valid Published version exists.
   *
   * Algorithm (D-M4-05):
   * 1. Ask provider for all Published versions.
   * 2. Keep only strings that pass isValidContentVersion; log.warn for invalid ones (DB edits).
   * 3. Pick the largest by compareContentVersion; tie-break by lexicographic string order.
   * 4. Return null if no valid version remains.
   */
  async resolveLatestVersion(): Promise<string | null> {
    const rawVersions = await this.contentProvider.findPublishedVersions(INTERPRETATION_LANGUAGE);

    const validVersions: string[] = [];
    for (const v of rawVersions) {
      if (isValidContentVersion(v)) {
        validVersions.push(v);
      } else {
        this.logger.warn('interpretation.invalid_version_format', { version: v });
      }
    }

    if (validVersions.length === 0) {
      return null;
    }

    // Pick max; tie-break lexicographically for determinism (D-M4-05)
    return validVersions.reduce((best, current) => {
      const cmp = compareContentVersion(current, best);
      if (cmp > 0) return current;
      if (cmp === 0) return current > best ? current : best;
      return best;
    });
  }

  /**
   * Looks up interpretation content for a given chart view.
   *
   * Version selection (Mục 13):
   * - Chart pinned (snapshotInterpretationVersion != null) → use that exact version.
   * - Chart null → call resolveLatestVersion(); if null, return { version: null, items: [] }.
   *
   * Result ordering (D-M4-11):
   * - Derive canonical subject list from chart.
   * - Fetch records from provider (order not guaranteed).
   * - Build a Map keyed by subjectType+'\0'+subjectKey; first record wins on duplicates.
   * - Walk subjects in canonical order; skip subjects without a matching record (log.warn).
   * - Ignore extra records returned by provider that don't match any subject.
   */
  async lookup(chart: InterpretationChartView): Promise<InterpretationResult> {
    // Determine version
    let version: string | null;

    if (chart.snapshotInterpretationVersion !== null) {
      // Chart is pinned — do NOT call resolveLatestVersion
      version = chart.snapshotInterpretationVersion;
    } else {
      version = await this.resolveLatestVersion();
    }

    // No Published version at all → return empty
    if (version === null) {
      return { version: null, items: [] };
    }

    // Derive canonical subjects from chart
    const subjects = deriveInterpretationSubjects(chart);

    // Short-circuit: no subjects derived (e.g. empty planets list)
    if (subjects.length === 0) {
      return { version, items: [] };
    }

    // Fetch content records from provider
    const records = await this.contentProvider.findPublishedContents(
      INTERPRETATION_LANGUAGE,
      version,
      subjects,
    );

    // Build Map for O(1) lookup — first record wins on key collision (UNIQUE in DB, but service stays safe)
    const recordMap = new Map<string, InterpretationContentRecord>();
    for (const record of records) {
      const key = `${record.subjectType}\0${record.subjectKey}`;
      if (!recordMap.has(key)) {
        recordMap.set(key, record);
      }
    }

    // Walk canonical order, collect items, track missing subjects
    const items: InterpretationContentRecord[] = [];
    const missingKeys: string[] = [];

    for (const subject of subjects) {
      const key = `${subject.subjectType}\0${subject.subjectKey}`;
      const record = recordMap.get(key);
      if (record) {
        items.push(record);
      } else {
        missingKeys.push(subject.subjectKey);
      }
    }

    // Warn if any subjects lacked content
    if (missingKeys.length > 0) {
      this.logger.warn('interpretation.content_missing', {
        chartId: chart.id,
        version,
        missingCount: missingKeys.length,
        missingKeys: missingKeys.slice(0, 20), // cap at 20 keys for log safety
      });
    }

    // Special case: pinned version exists but provider returned no rows at all
    if (
      items.length === 0 &&
      records.length === 0 &&
      chart.snapshotInterpretationVersion !== null
    ) {
      this.logger.warn('interpretation.version_unavailable', {
        chartId: chart.id,
        version,
      });
    }

    return { version, items };
  }
}
