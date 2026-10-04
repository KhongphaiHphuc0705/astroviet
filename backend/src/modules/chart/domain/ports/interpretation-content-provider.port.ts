import {
  InterpretationContentRecord,
  InterpretationSubjectRef,
} from '../types/interpretation.types.js';

export interface IInterpretationContentProvider {
  /**
   * Returns distinct Published versions for a given language.
   * If no versions exist, returns an empty array.
   *
   * CONTRACT:
   * - Implementation MUST filter for `status = 'Published'`.
   * - `language` is always explicit (e.g., 'vi').
   * - Infrastructure errors MUST be thrown as `InfrastructureError` and NOT suppressed into `[]`.
   * - Returns raw strings; caller is responsible for validating with `isValidContentVersion` before comparing.
   */
  findPublishedVersions(language: string): Promise<string[]>;

  /**
   * Returns published contents for the specified language, version, and subjects.
   *
   * CONTRACT:
   * - Implementation MUST filter for `status = 'Published'` and `tone IS NULL`.
   * - `language` and `version` are always explicit.
   * - Return order is NOT guaranteed; the caller is responsible for sorting the results.
   * - If no rows match, returns an empty array `[]`.
   * - If `subjects` is empty, returns an empty array `[]` without querying.
   * - Infrastructure errors MUST be thrown as `InfrastructureError` and NOT suppressed into `[]`.
   */
  findPublishedContents(
    language: string,
    version: string,
    subjects: readonly InterpretationSubjectRef[],
  ): Promise<InterpretationContentRecord[]>;
}
