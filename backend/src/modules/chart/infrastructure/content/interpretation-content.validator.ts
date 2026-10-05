import { isValidContentVersion } from '../../domain/interpretation/content-version.js';
import { enumerateMvpInterpretationSubjects } from '../../domain/interpretation/enumerate-mvp-subjects.js';
import { isValidInterpretationSubjectKey } from '../../domain/interpretation/interpretation-subject-key.js';
import {
  MVP_INTERPRETATION_SUBJECT_TYPES,
  INTERPRETATION_SUBJECT_TYPES,
  MvpInterpretationSubjectType,
} from '../../domain/types/interpretation.types.js';

import {
  InterpretationContentFileSchema,
  InterpretationContentFile,
} from './interpretation-content-file.schema.js';

export const OWNER_CONTENT_PLACEHOLDER = '[OWNER_CONTENT_REQUIRED]';

export type ContentSubjectRef = { subjectType: string; subjectKey: string };

export type ContentCoverage = {
  expected: number;
  present: number;
  missing: ContentSubjectRef[];
  unexpected: ContentSubjectRef[];
};

export type ValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
  coverage: ContentCoverage | null;
  file: InterpretationContentFile | null;
};

export function validateInterpretationContentText(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      issues: [{ code: 'MALFORMED_JSON', message: 'Invalid JSON format' }],
      coverage: null,
      file: null,
    };
  }
  return validateInterpretationContent(parsed);
}

export function validateInterpretationContent(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  const parseResult = InterpretationContentFileSchema.safeParse(input);

  if (!parseResult.success) {
    for (const error of parseResult.error.errors) {
      const pathStr = error.path.join('.');
      let code = 'SCHEMA_ERROR';
      if (
        pathStr.endsWith('.bodyText') &&
        error.code === 'custom' &&
        error.message === 'Body text must not be empty or whitespace only'
      ) {
        code = 'EMPTY_BODY_TEXT';
      } else if (pathStr === 'status' && error.code === 'invalid_enum_value') {
        code = 'INVALID_STATUS';
      }
      issues.push({
        code,
        message: error.message,
        path: pathStr,
      });
    }
    // We can't proceed with deep validation if schema is invalid because types don't match.
    // However, if we want to collect all errors, we'd have to do partial checks.
    // Since we return early here, Zod errors are exhaustive for structure.
    return { ok: false, issues, coverage: null, file: null };
  }

  const file = parseResult.data;

  // Language
  if (file.language !== 'vi') {
    issues.push({
      code: 'INVALID_LANGUAGE',
      message: `Language must be 'vi'. Found: ${file.language}`,
      path: 'language',
    });
  }

  // Version
  if (!isValidContentVersion(file.version)) {
    issues.push({
      code: 'INVALID_VERSION',
      message: `Invalid version format: ${file.version}`,
      path: 'version',
    });
  } else {
    // strict major.minor format
    const parts = file.version.split('.');
    if (parts.length !== 2) {
      issues.push({
        code: 'INVALID_VERSION',
        message: `Version must be strictly major.minor format: ${file.version}`,
        path: 'version',
      });
    }
  }

  // Items validation
  const seenKeys = new Set<string>();
  const expectedSubjects = enumerateMvpInterpretationSubjects();
  const presentSubjects = new Set<string>();

  const mvpTypes = new Set<string>(MVP_INTERPRETATION_SUBJECT_TYPES);
  const reservedTypes = new Set<string>(INTERPRETATION_SUBJECT_TYPES);

  file.items.forEach((item, index) => {
    const itemPath = `items.${index}`;
    const identity = `${item.subjectType}:${item.subjectKey}`;

    // Duplicate check
    if (seenKeys.has(identity)) {
      issues.push({
        code: 'DUPLICATE_SUBJECT',
        message: `Duplicate subject: ${identity}`,
        path: itemPath,
      });
    }
    seenKeys.add(identity);
    presentSubjects.add(identity);

    // Placeholder check
    if (file.status === 'Published' && item.bodyText.includes(OWNER_CONTENT_PLACEHOLDER)) {
      issues.push({
        code: 'PLACEHOLDER_CONTENT',
        message: `Placeholder content not allowed in Published status`,
        path: `${itemPath}.bodyText`,
      });
    }

    // Subject type check
    if (!mvpTypes.has(item.subjectType)) {
      if (reservedTypes.has(item.subjectType)) {
        issues.push({
          code: 'RESERVED_SUBJECT_TYPE',
          message: `Reserved subject type not allowed in MVP: ${item.subjectType}`,
          path: `${itemPath}.subjectType`,
        });
      } else {
        issues.push({
          code: 'INVALID_SUBJECT_TYPE',
          message: `Invalid subject type: ${item.subjectType}`,
          path: `${itemPath}.subjectType`,
        });
      }
    } else {
      // Key grammar check
      if (
        !isValidInterpretationSubjectKey(
          item.subjectType as MvpInterpretationSubjectType,
          item.subjectKey,
        )
      ) {
        issues.push({
          code: 'INVALID_SUBJECT_KEY',
          message: `Invalid subject key grammar for type ${item.subjectType}: ${item.subjectKey}`,
          path: `${itemPath}.subjectKey`,
        });
      }
    }
  });

  // Coverage calculation
  const missing: ContentSubjectRef[] = [];
  const unexpected: ContentSubjectRef[] = [];
  const expectedSet = new Set(expectedSubjects.map((s) => `${s.subjectType}:${s.subjectKey}`));

  expectedSubjects.forEach((s) => {
    if (!presentSubjects.has(`${s.subjectType}:${s.subjectKey}`)) {
      missing.push(s);
    }
  });

  file.items.forEach((item) => {
    if (!expectedSet.has(`${item.subjectType}:${item.subjectKey}`)) {
      unexpected.push({ subjectType: item.subjectType, subjectKey: item.subjectKey });
    }
  });

  const coverage: ContentCoverage = {
    expected: expectedSubjects.length,
    present: expectedSubjects.length - missing.length,
    missing,
    unexpected,
  };

  if (unexpected.length > 0) {
    unexpected.forEach((u) => {
      issues.push({
        code: 'UNEXPECTED_SUBJECT',
        message: `Unexpected subject: ${u.subjectType}:${u.subjectKey}`,
      });
    });
  }

  if (file.status === 'Published' && missing.length > 0) {
    issues.push({
      code: 'INCOMPLETE_PUBLISHED_CONTENT',
      message: `Published content is missing ${missing.length} MVP subjects.`,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
    coverage,
    file: issues.length === 0 ? file : null,
  };
}
