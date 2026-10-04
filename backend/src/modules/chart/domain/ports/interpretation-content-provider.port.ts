import {
  InterpretationContentRecord,
  InterpretationSubjectRef,
} from '../types/interpretation.types.js';

export interface IInterpretationContentProvider {
  /**
   * Returns distinct Published versions for a given language.
   * If none, returns an empty array.
   */
  findPublishedVersions(language: string): Promise<string[]>;

  /**
   * Returns published contents for the specified language, version, and subjects.
   * Only returns rows with status='Published' and tone=NULL.
   * If subjects is empty, returns an empty array without querying.
   */
  findPublishedContents(
    language: string,
    version: string,
    subjects: readonly InterpretationSubjectRef[],
  ): Promise<InterpretationContentRecord[]>;
}
