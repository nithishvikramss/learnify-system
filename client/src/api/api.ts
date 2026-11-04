import axios, { isAxiosError } from 'axios';
import type {
  Student, Subject, Marks, MarksDetail, StaffUser, NewStaffUser, PageResponse,
  SubjectAverage, TopStudent, PassFailStats, AnalyticsSummary
} from '../types';
import { getSession, clearSession, type Session } from '../auth/session';

// Defaults to the Vite dev proxy (/api -> http://localhost:8080). Override with VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Send the login token with every request
api.interceptors.request.use(config => {
  const session = getSession();
  if (session) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

// If the server says the token is invalid/expired, log out and go back to the login page
api.interceptors.response.use(undefined, err => {
  const isLoginCall = err.config?.url?.endsWith('/auth/login');
  if (isAxiosError(err) && err.response?.status === 401 && !isLoginCall) {
    clearSession();
    if (window.location.pathname !== '/login') window.location.assign('/login?expired=1');
  }
  return Promise.reject(err);
});

// --- Error helpers ---
interface ApiErrorBody {
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Returns the server's user-friendly error message, or a fallback. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    if (!err.response) return 'Cannot reach the server. Make sure the backend is running.';
    return err.response.data?.message || fallback;
  }
  return fallback;
}

/** Returns the HTTP status of a failed request (undefined for network errors). */
export function getErrorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}

/** Returns per-field validation errors sent by the server (empty object if none). */
export function getFieldErrors(err: unknown): Record<string, string> {
  if (isAxiosError<ApiErrorBody>(err)) return err.response?.data?.fieldErrors ?? {};
  return {};
}

// --- Auth APIs ---
export const login = (username: string, password: string) =>
  api.post<Session>('/auth/login', { username, password }).then(r => r.data);

export const changeOwnPassword = (body: { currentPassword: string; newPassword: string }) =>
  api.put('/users/me/password', body).then(r => r.data);

// --- Staff account APIs (admin only) ---
export const getUsers = () =>
  api.get<StaffUser[]>('/users').then(r => r.data);

export const createUser = (user: NewStaffUser) =>
  api.post<StaffUser>('/users', user).then(r => r.data);

export const setUserDisabled = (id: string, disabled: boolean) =>
  api.put<StaffUser>(`/users/${id}/status`, { disabled }).then(r => r.data);

export const deleteUser = (id: string) =>
  api.delete(`/users/${id}`).then(r => r.data);

// --- Student APIs ---
export const addStudent = (student: Student) =>
  api.post<Student>('/students', student).then(r => r.data);

export const getAllStudents = (params?: { department?: string; search?: string }) =>
  api.get<Student[]>('/students', { params }).then(r => r.data);

export const getStudentPage = (params: { page: number; size: number; search?: string; department?: string; semester?: string }) =>
  api.get<PageResponse<Student>>('/students/page', { params }).then(r => r.data);

export const getStudentById = (id: string) =>
  api.get<Student>(`/students/${id}`).then(r => r.data);

export const updateStudent = (id: string, student: Student) =>
  api.put<Student>(`/students/${id}`, student).then(r => r.data);

export const deleteStudent = (id: string) =>
  api.delete(`/students/${id}`).then(r => r.data);

// --- Subject APIs ---
export const addSubject = (subject: Subject) =>
  api.post<Subject>('/subjects', subject).then(r => r.data);

export const getAllSubjects = () =>
  api.get<Subject[]>('/subjects').then(r => r.data);

export const updateSubject = (id: string, subject: Subject) =>
  api.put<Subject>(`/subjects/${id}`, subject).then(r => r.data);

/** cascade=true also deletes the subject's marks; otherwise the server refuses (409) if marks exist. */
export const deleteSubject = (id: string, cascade = false) =>
  api.delete(`/subjects/${id}`, { params: { cascade } }).then(r => r.data);

// --- Marks APIs ---
export const addMarks = (marks: Marks) =>
  api.post<Marks>('/marks', marks).then(r => r.data);

export const getAllMarks = () =>
  api.get<MarksDetail[]>('/marks').then(r => r.data);

export const getMarksPage = (params: { page: number; size: number; search?: string; subjectId?: string; result?: string }) =>
  api.get<PageResponse<MarksDetail>>('/marks/page', { params }).then(r => r.data);

export const updateMarks = (id: string, marks: { internalMarks: number; externalMarks: number }) =>
  api.put<Marks>(`/marks/${id}`, marks).then(r => r.data);

export const deleteMarks = (id: string) =>
  api.delete(`/marks/${id}`).then(r => r.data);

export const getMarksByStudent = (studentId: string) =>
  api.get<MarksDetail[]>(`/marks/student/${studentId}`).then(r => r.data);

// --- Analytics APIs ---
export const getAnalyticsSummary = () =>
  api.get<AnalyticsSummary>('/analytics/summary').then(r => r.data);

export const getSubjectAverages = () =>
  api.get<SubjectAverage[]>('/analytics/subject-averages').then(r => r.data);

export const getTopStudents = (limit = 5) =>
  api.get<TopStudent[]>('/analytics/top-students', { params: { limit } }).then(r => r.data);

export const getPassFailStats = () =>
  api.get<PassFailStats>('/analytics/pass-fail').then(r => r.data);

export const getClassAverage = () =>
  api.get<{ classAverage: number }>('/analytics/class-average').then(r => r.data);

export const getStudentsBelowThreshold = (threshold = 40) =>
  api.get<TopStudent[]>('/analytics/below-threshold', { params: { threshold } }).then(r => r.data);

export default api;
