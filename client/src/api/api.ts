import axios from 'axios';
import type {
  Student, Subject, Marks, MarksDetail,
  SubjectAverage, TopStudent, PassFailStats, AnalyticsSummary
} from '../types';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Student APIs ---
export const addStudent = (student: Student) =>
  api.post<Student>('/students', student).then(r => r.data);

export const getAllStudents = (params?: { department?: string; search?: string }) =>
  api.get<Student[]>('/students', { params }).then(r => r.data);

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

export const deleteSubject = (id: string) =>
  api.delete(`/subjects/${id}`).then(r => r.data);

// --- Marks APIs ---
export const addMarks = (marks: Marks) =>
  api.post<Marks>('/marks', marks).then(r => r.data);

export const getAllMarks = () =>
  api.get<MarksDetail[]>('/marks').then(r => r.data);

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
