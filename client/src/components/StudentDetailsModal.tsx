import { useEffect, useState } from 'react';
import { X, BookOpen, CalendarCheck } from 'lucide-react';
import { getMarksByStudent, getErrorMessage } from '../api/api';
import type { MarksDetail, Student } from '../types';
import AttendanceSummaryTable from './AttendanceSummaryTable';

interface Props {
  student: Student;
  onClose: () => void;
}

/**
 * Read-only view of one student: profile plus every subject's marks from the database.
 * Render it with key={student.id} so its loading state resets for each student.
 */
export default function StudentDetailsModal({ student, onClose }: Props) {
  const [marks, setMarks] = useState<MarksDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMarksByStudent(student.id!)
      .then(data => { if (active) setMarks(data); })
      .catch(err => { if (active) setError(getErrorMessage(err, 'Failed to load marks')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [student.id]);

  const average = marks.length ? marks.reduce((sum, m) => sum + m.percentage, 0) / marks.length : 0;
  const passedAll = marks.length > 0 && marks.every(m => m.passed);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }} role="dialog" aria-label="Student details">
        <div className="modal-header">
          <span className="modal-title">Student Details</span>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">
          <dl className="details-grid">
            <dt>Name</dt><dd>{student.name}</dd>
            <dt>Register No</dt><dd><code className="reg-no">{student.registerNumber || '—'}</code></dd>
            <dt>Department</dt><dd>{student.department}</dd>
            <dt>Semester</dt><dd>Semester {student.semester}</dd>
            <dt>Email</dt><dd>{student.email || '—'}</dd>
          </dl>

          <h3 className="details-heading"><BookOpen size={14} /> Academic record</h3>
          {loading ? (
            <div className="loading-overlay" style={{ padding: 20 }}><div className="spinner" /><span>Loading marks…</span></div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : marks.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No marks recorded for this student yet.</p></div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Subject</th><th>Internal</th><th>External</th><th>Total</th><th>%</th><th>Result</th></tr>
                  </thead>
                  <tbody>
                    {marks.map(m => (
                      <tr key={m.marksId}>
                        <td style={{ fontWeight: 500 }}>{m.subjectName}</td>
                        <td>{m.internalMarks}</td>
                        <td>{m.externalMarks}</td>
                        <td>{m.totalMarks} / {m.maxMarks}</td>
                        <td>{m.percentage}%</td>
                        <td>
                          <span className={`badge ${m.passed ? 'badge-success' : 'badge-danger'}`}>
                            {m.passed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="details-summary">
                <span>Subjects: <strong>{marks.length}</strong></span>
                <span>Average: <strong>{average.toFixed(2)}%</strong></span>
                <span>Overall: <span className={`badge ${passedAll ? 'badge-success' : 'badge-danger'}`}>
                  {passedAll ? 'PASS' : 'FAIL'}
                </span></span>
              </div>
            </>
          )}

          <h3 className="details-heading" style={{ marginTop: 18 }}><CalendarCheck size={14} /> Attendance</h3>
          <AttendanceSummaryTable studentId={student.id!} />
        </div>
      </div>
    </div>
  );
}
