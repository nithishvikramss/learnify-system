import type { NewStaffUser, Student, Subject } from '../types';

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[A-Za-z0-9-]{2,15}$/;
const REG_NO_RE = /^[A-Za-z0-9]{3,20}$/;
const USERNAME_RE = /^[A-Za-z0-9._-]{3,50}$/;

/** Client-side checks that mirror the server rules, for instant feedback. */
export function validateStudent(s: Student): FieldErrors {
  const e: FieldErrors = {};
  if (!s.name.trim()) e.name = 'Name is required';
  else if (s.name.trim().length > 100) e.name = 'Name must be at most 100 characters';
  if (!s.registerNumber?.trim()) e.registerNumber = 'Register number is required';
  else if (!REG_NO_RE.test(s.registerNumber.trim())) e.registerNumber = 'Register number must be 3-20 letters or digits';
  if (!s.department) e.department = 'Department is required';
  if (s.semester < 1 || s.semester > 8) e.semester = 'Semester must be between 1 and 8';
  if (s.email && !EMAIL_RE.test(s.email)) e.email = 'Enter a valid email address';
  return e;
}

export function validateSubject(s: Subject): FieldErrors {
  const e: FieldErrors = {};
  if (!s.name.trim()) e.name = 'Subject name is required';
  if (!CODE_RE.test(s.code)) e.code = 'Code must be 2-15 letters, digits or hyphens';
  if (!Number.isFinite(s.maxMarks) || s.maxMarks < 1 || s.maxMarks > 200) {
    e.maxMarks = 'Max marks must be between 1 and 200';
  }
  return e;
}

export function validateNewStaff(u: NewStaffUser): FieldErrors {
  const e: FieldErrors = {};
  if (!u.fullName.trim()) e.fullName = 'Full name is required';
  if (!USERNAME_RE.test(u.username.trim())) e.username = 'Username must be 3-50 letters, digits, dots, hyphens or underscores';
  if (u.password.length < 8 || u.password.length > 72) e.password = 'Password must be 8-72 characters';
  return e;
}

export function validatePasswordChange(p: { currentPassword: string; newPassword: string; confirmPassword: string }): FieldErrors {
  const e: FieldErrors = {};
  if (!p.currentPassword) e.currentPassword = 'Current password is required';
  if (p.newPassword.length < 8 || p.newPassword.length > 72) e.newPassword = 'New password must be 8-72 characters';
  else if (p.newPassword === p.currentPassword) e.newPassword = 'New password must be different from the current password';
  if (p.confirmPassword !== p.newPassword) e.confirmPassword = 'Passwords do not match';
  return e;
}

export const hasErrors = (e: FieldErrors) => Object.keys(e).length > 0;
