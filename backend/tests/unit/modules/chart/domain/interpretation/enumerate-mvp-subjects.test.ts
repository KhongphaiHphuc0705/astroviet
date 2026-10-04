import { describe, expect, it } from 'vitest';

import { enumerateMvpInterpretationSubjects } from '../../../../../../src/modules/chart/domain/interpretation/enumerate-mvp-subjects.js';
import { isValidInterpretationSubjectKey } from '../../../../../../src/modules/chart/domain/interpretation/interpretation-subject-key.js';
import { MVP_INTERPRETATION_SUBJECT_TYPES } from '../../../../../../src/modules/chart/domain/types/interpretation.types.js';

describe('enumerateMvpInterpretationSubjects', () => {
  it('should generate exactly 252 canonical subjects', () => {
    const subjects = enumerateMvpInterpretationSubjects();

    expect(subjects).toHaveLength(252);

    const planetInSign = subjects.filter((s) => s.subjectType === 'PlanetInSign');
    const angleInSign = subjects.filter((s) => s.subjectType === 'AngleInSign');
    const planetInHouse = subjects.filter((s) => s.subjectType === 'PlanetInHouse');

    expect(planetInSign).toHaveLength(120); // 10 planets * 12 signs
    expect(angleInSign).toHaveLength(12); // 1 angle * 12 signs
    expect(planetInHouse).toHaveLength(120); // 10 planets * 12 houses

    // Verify ordering matches derive Interpretation subjects
    expect(subjects[0].subjectType).toBe('PlanetInSign');
    expect(subjects[120].subjectType).toBe('AngleInSign');
    expect(subjects[132].subjectType).toBe('PlanetInHouse');
  });

  it('should generate unique keys', () => {
    const subjects = enumerateMvpInterpretationSubjects();
    const keys = new Set(subjects.map((s) => `${s.subjectType}:${s.subjectKey}`));
    expect(keys.size).toBe(252);
  });

  it('should generate only keys that pass the grammar validator', () => {
    const subjects = enumerateMvpInterpretationSubjects();
    const invalidSubjects = subjects.filter(
      (s) => !isValidInterpretationSubjectKey(s.subjectType, s.subjectKey),
    );
    expect(invalidSubjects).toHaveLength(0);
  });

  it('should start with Sun_in_Aries and end with Pluto_in_House_12', () => {
    const subjects = enumerateMvpInterpretationSubjects();
    expect(subjects[0]).toEqual({ subjectType: 'PlanetInSign', subjectKey: 'Sun_in_Aries' });
    expect(subjects[251]).toEqual({
      subjectType: 'PlanetInHouse',
      subjectKey: 'Pluto_in_House_12',
    });
  });

  it('should match the MVP_INTERPRETATION_SUBJECT_TYPES order', () => {
    expect(MVP_INTERPRETATION_SUBJECT_TYPES).toEqual([
      'PlanetInSign',
      'AngleInSign',
      'PlanetInHouse',
    ]);
  });
});
