import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStudent, validateSubject, validateNewStaff, validatePasswordChange, hasErrors } from '../../src/utils/validation.ts';
import type { Student, Subject } from '../../src/types/index.ts';

const student = (over: Partial<Student> = {}): Student => ({
  name: 'Arun Kumar', registerNumber: '21CS001', department: 'Civil', semester: 3, email: '', ...over,
});
const subject = (over: Partial<Subject> = {}): Subject => ({ name: 'Maths', code: 'MA101', maxMarks: 100, ...over });

test('FE-STU-P-01 valid student has no errors', () => {
  assert.deepEqual(validateStudent(student()), {});
  assert.equal(hasErrors(validateStudent(student())), false);
});

test('FE-STU-B-01 semester boundaries 1 and 8 accepted, 0 and 9 rejected', () => {
  assert.equal(validateStudent(student({ semester: 1 })).semester, undefined);
  assert.equal(validateStudent(student({ semester: 8 })).semester, undefined);
  assert.ok(validateStudent(student({ semester: 0 })).semester);
  assert.ok(validateStudent(student({ semester: 9 })).semester);
});

test('FE-STU-B-02 name 100 chars accepted, 101 rejected, blank rejected', () => {
  assert.equal(validateStudent(student({ name: 'a'.repeat(100) })).name, undefined);
  assert.equal(validateStudent(student({ name: 'a'.repeat(101) })).name, 'Name must be at most 100 characters');
  assert.equal(validateStudent(student({ name: '   ' })).name, 'Name is required');
});

test('FE-STU-B-03 register number length 3..20 letters/digits', () => {
  for (const ok of ['ABC', 'a'.repeat(20), '21cs001']) {
    assert.equal(validateStudent(student({ registerNumber: ok })).registerNumber, undefined, ok);
  }
  for (const bad of ['AB', 'a'.repeat(21), '21-CS', '21 CS', '']) {
    assert.ok(validateStudent(student({ registerNumber: bad })).registerNumber, bad);
  }
});

test('FE-STU-N-01 invalid email rejected, empty email allowed', () => {
  assert.equal(validateStudent(student({ email: '' })).email, undefined);
  assert.equal(validateStudent(student({ email: 'x@y' })).email, 'Enter a valid email address');
  assert.equal(validateStudent(student({ email: 'a@b.co' })).email, undefined);
});

test('FE-SUB-B-01 max marks boundaries 1 and 200 accepted, 0, 201 and NaN rejected', () => {
  assert.equal(validateSubject(subject({ maxMarks: 1 })).maxMarks, undefined);
  assert.equal(validateSubject(subject({ maxMarks: 200 })).maxMarks, undefined);
  assert.ok(validateSubject(subject({ maxMarks: 0 })).maxMarks);
  assert.ok(validateSubject(subject({ maxMarks: 201 })).maxMarks);
  assert.ok(validateSubject(subject({ maxMarks: Number.NaN })).maxMarks);
});

test('FE-SUB-B-02 subject code 2..15 chars', () => {
  assert.equal(validateSubject(subject({ code: 'MA' })).code, undefined);
  assert.equal(validateSubject(subject({ code: 'A'.repeat(15) })).code, undefined);
  assert.ok(validateSubject(subject({ code: 'M' })).code);
  assert.ok(validateSubject(subject({ code: 'A'.repeat(16) })).code);
  assert.ok(validateSubject(subject({ code: 'MA 101' })).code);
});

test('FE-STAFF-B-01 new staff: username 3 chars ok, 2 rejected; password 8 ok, 7 and 73 rejected', () => {
  const ok = { username: 'abc', fullName: 'A', password: 'a'.repeat(8) };
  assert.deepEqual(validateNewStaff(ok), {});
  assert.ok(validateNewStaff({ ...ok, username: 'ab' }).username);
  assert.ok(validateNewStaff({ ...ok, password: 'a'.repeat(7) }).password);
  assert.ok(validateNewStaff({ ...ok, password: 'a'.repeat(73) }).password);
  assert.ok(validateNewStaff({ ...ok, fullName: ' ' }).fullName);
});

test('FE-STAFF-N-01 password change: confirm must match and new must differ', () => {
  const ok = { currentPassword: 'old-pass-1', newPassword: 'new-pass-1', confirmPassword: 'new-pass-1' };
  assert.deepEqual(validatePasswordChange(ok), {});
  assert.ok(validatePasswordChange({ ...ok, confirmPassword: 'x' }).confirmPassword);
  assert.ok(validatePasswordChange({ ...ok, newPassword: 'old-pass-1', confirmPassword: 'old-pass-1' }).newPassword);
  assert.ok(validatePasswordChange({ ...ok, currentPassword: '' }).currentPassword);
});
