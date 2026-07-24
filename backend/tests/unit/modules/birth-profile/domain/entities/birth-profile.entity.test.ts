import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  BirthProfile,
  BirthProfileProps,
} from '../../../../../../src/modules/birth-profile/domain/entities/birth-profile.entity.js';
import {
  InvalidBirthTimeStateError,
  InvalidLabelError,
  InvalidVersionError,
} from '../../../../../../src/modules/birth-profile/domain/errors/birth-profile.errors.js';
import { BirthDate } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-date.vo.js';
import { BirthLocation } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-location.vo.js';
import { BirthTime } from '../../../../../../src/modules/birth-profile/domain/value-objects/birth-time.vo.js';
import { Coordinates } from '../../../../../../src/modules/birth-profile/domain/value-objects/coordinates.vo.js';
import { Timezone } from '../../../../../../src/modules/birth-profile/domain/value-objects/timezone.vo.js';

describe('BirthProfile Entity', () => {
  let birthDate: BirthDate;
  let birthTime: BirthTime;
  let birthLocation: BirthLocation;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));

    birthDate = BirthDate.create('1990-01-01');
    birthTime = BirthTime.create('12:30:00');
    birthLocation = BirthLocation.create(
      'Hanoi',
      Coordinates.create(21.0, 105.0),
      Timezone.create('Asia/Ho_Chi_Minh'),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getValidProps = (): BirthProfileProps => ({
    id: 'uuid-1234',
    userId: 'user-uuid',
    label: 'My Profile',
    fullName: 'John Doe',
    birthDate,
    birthTime,
    isBirthTimeKnown: true,
    birthLocation,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  });

  it('1. should create successfully with valid props (known time)', () => {
    const props = getValidProps();
    const profile = BirthProfile.create(props);
    expect(profile.id).toBe(props.id);
    expect(profile.isBirthTimeKnown).toBe(true);
    expect(profile.birthTime).not.toBeNull();
  });

  it('2. should create successfully with valid props (unknown time)', () => {
    const props = getValidProps();
    props.isBirthTimeKnown = false;
    props.birthTime = null;
    const profile = BirthProfile.create(props);
    expect(profile.isBirthTimeKnown).toBe(false);
    expect(profile.birthTime).toBeNull();
  });

  it('3. should reject if isBirthTimeKnown=false but birthTime is NOT null', () => {
    const props = getValidProps();
    props.isBirthTimeKnown = false;
    // birthTime is provided (not null)
    expect(() => BirthProfile.create(props)).toThrow(InvalidBirthTimeStateError);
  });

  it('4. should reject if isBirthTimeKnown=true but birthTime IS null', () => {
    const props = getValidProps();
    props.isBirthTimeKnown = true;
    props.birthTime = null;
    expect(() => BirthProfile.create(props)).toThrow(InvalidBirthTimeStateError);
  });

  it('5. should reject if label is empty', () => {
    const props = getValidProps();
    props.label = '';
    expect(() => BirthProfile.create(props)).toThrow(InvalidLabelError);
  });

  it('6. should reject if label is too long (>100 chars)', () => {
    const props = getValidProps();
    props.label = 'a'.repeat(101);
    expect(() => BirthProfile.create(props)).toThrow(InvalidLabelError);
  });

  it('7. should accept label exactly 1 and exactly 100 chars', () => {
    const props1 = getValidProps();
    props1.label = 'a';
    expect(() => BirthProfile.create(props1)).not.toThrow();

    const props100 = getValidProps();
    props100.label = 'a'.repeat(100);
    expect(() => BirthProfile.create(props100)).not.toThrow();
  });

  it('8. should reject version < 1', () => {
    const props = getValidProps();
    props.version = 0;
    expect(() => BirthProfile.create(props)).toThrow(InvalidVersionError);
  });

  it('9. update() should return a new instance (immutability)', () => {
    const profile = BirthProfile.create(getValidProps());
    const updatedProfile = profile.update({ label: 'Updated Label' });

    expect(profile.label).toBe('My Profile'); // Old instance unchanged
    expect(updatedProfile.label).toBe('Updated Label'); // New instance updated
    expect(profile).not.toBe(updatedProfile); // Different references
  });

  it('10. update() should re-validate invariants (reject invalid label)', () => {
    const profile = BirthProfile.create(getValidProps());
    expect(() => profile.update({ label: '' })).toThrow(InvalidLabelError);
  });

  it('11. update() should re-validate invariants (reject invalid time state false-notnull)', () => {
    const profile = BirthProfile.create(getValidProps()); // known time
    // Attempting to set unknown time without clearing birthTime should fail
    expect(() => profile.update({ isBirthTimeKnown: false })).toThrow(InvalidBirthTimeStateError);
  });

  it('11b. update() should re-validate invariants (reject invalid time state true-null)', () => {
    const profile = BirthProfile.create({
      ...getValidProps(),
      isBirthTimeKnown: false,
      birthTime: null,
    }); // unknown time
    // Attempting to set known time without providing birthTime should fail
    expect(() => profile.update({ isBirthTimeKnown: true })).toThrow(InvalidBirthTimeStateError);
  });

  it('11c. update() should re-validate invariants (reject version < 1)', () => {
    const profile = BirthProfile.create(getValidProps());
    expect(() => profile.update({ version: 0 })).toThrow(InvalidVersionError);
  });

  it('12. reconstitute() should skip full validation', () => {
    const props = getValidProps();
    props.label = ''; // Invalid label
    // Should NOT throw because reconstitute assumes DB data is valid
    const profile = BirthProfile.reconstitute(props);
    expect(profile.label).toBe('');
  });

  it('13. should expose all properties via getters correctly', () => {
    const props = getValidProps();
    const profile = BirthProfile.create(props);

    expect(profile.id).toBe(props.id);
    expect(profile.userId).toBe(props.userId);
    expect(profile.label).toBe(props.label);
    expect(profile.fullName).toBe(props.fullName);
    expect(profile.birthDate).toBe(props.birthDate);
    expect(profile.birthTime).toBe(props.birthTime);
    expect(profile.isBirthTimeKnown).toBe(props.isBirthTimeKnown);
    expect(profile.birthLocation).toBe(props.birthLocation);
    expect(profile.createdAt).toBe(props.createdAt);
    expect(profile.updatedAt).toBe(props.updatedAt);
    expect(profile.deletedAt).toBe(props.deletedAt);
    expect(profile.version).toBe(props.version);
  });
});
