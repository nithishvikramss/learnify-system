export interface Student {
  id?: string;
  name: string;
  registerNumber: string;
  department: string;
  semester: number;
  email: string;
}

export interface Subject {
  id?: string;
  name: string;
  code: string;
  maxMarks: number;
}

export interface Marks {
  id?: string;
  studentId: string;
  subjectId: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks?: number;
}

export interface MarksDetail {
  marksId: string;
  studentId: string;
  studentName: string;
  registerNumber?: string;
  department: string;
  semester: number;
  subjectId: string;
  subjectName: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  maxMarks: number;
  passed: boolean;
  percentage: number;
}

export interface SubjectAverage {
  subjectId: string;
  subjectName: string;
  averageMarks: number;
  totalStudents: number;
}

export interface TopStudent {
  studentId: string;
  studentName: string;
  department: string;
  semester: number;
  averageMarks: number;
  percentage: number;
  rank: number;
}

export interface PassFailStats {
  totalStudents: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  failPercentage: number;
}

export interface AnalyticsSummary {
  totalStudents: number;
  totalSubjects: number;
  classAverage: number;
  passPercentage: number;
  failPercentage: number;
  belowThresholdCount: number;
  lowestSubject: string;
  topPerformerName: string;
  topPerformerScore: number;
  subjectAverages: SubjectAverage[];
  topStudents: TopStudent[];
  insights: string[];
}
