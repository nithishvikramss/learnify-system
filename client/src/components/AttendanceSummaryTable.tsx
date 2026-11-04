import { useEffect, useState } from 'react';
import { getAttendanceSummary, getErrorMessage } from '../api/api';
import type { AttendanceSummary } from '../types';

/** A student's attendance per subject; below 75% is flagged. Render with key={studentId}. */
export default function AttendanceSummaryTable({ studentId }: { studentId: string }) {
  const [rows, setRows] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAttendanceSummary(studentId)
      .then(data => { if (active) setRows(data); })
      .catch(err => { if (active) setError(getErrorMessage(err, 'Failed to load attendance')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  if (loading) return <div className="loading-overlay" style={{ padding: 16 }}><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (rows.length === 0) return <div className="empty-state" style={{ padding: 16 }}><p>No attendance recorded yet.</p></div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Subject</th><th>Attended</th><th>Attendance</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.subjectId}>
              <td style={{ fontWeight: 500 }}>{r.subjectName}</td>
              <td>{r.attended} / {r.total}</td>
              <td style={{ fontWeight: 600 }}>{r.percentage}%</td>
              <td>
                <span className={`badge ${r.belowMinimum ? 'badge-danger' : 'badge-success'}`}>
                  {r.belowMinimum ? 'Below 75%' : 'OK'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
