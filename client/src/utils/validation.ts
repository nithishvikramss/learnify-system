import type { Student, Subject } from '../types';

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[A-Za-z0-9-]{2,15}$/;
const REG_NO_RE = /^[A-Za-z0-9]{3,20}$/;

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

export const hasErrors = (e: FieldErrors) => Object.keys(e).length > 0;
