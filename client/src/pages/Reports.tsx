import { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, Award, BookOpen, User, Search } from 'lucide-react';
import {
  getAnalyticsSummary, getAllStudents, getMarksByStudent,
  getStudentsBelowThreshold, getTopStudents
} from '../api/api';
import type { AnalyticsSummary, Student, MarksDetail, TopStudent } from '../types';
import { SubjectBarChart } from '../components/Charts';

type Tab = 'overview' | 'reportcard' | 'weak';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportMarks, setReportMarks] = useState<MarksDetail[]>([]);
  const [weakStudents, setWeakStudents] = useState<TopStudent[]>([]);
  const [threshold, setThreshold] = useState(40);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAnalyticsSummary(),
      getAllStudents(),
      getStudentsBelowThreshold(threshold),
      getTopStudents(10),
    ])
      .then(([s, st, weak, top]) => {
        setSummary(s);
        setStudents(st);
        setWeakStudents(weak);
        setTopStudents(top);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadReport = () => {
    if (!selectedStudent) return;
    setReportLoading(true);
    getMarksByStudent(selectedStudent)
      .then(setReportMarks)
      .catch(console.error)
      .finally(() => setReportLoading(false));
  };

  const refreshWeak = () => {
    getStudentsBelowThreshold(threshold).then(setWeakStudents).catch(console.error);
  };

  const student = students.find(s => s.id === selectedStudent);
  const totalMarks = reportMarks.reduce((a, m) => a + m.totalMarks, 0);
  const avgMarks = reportMarks.length ? (totalMarks / reportMarks.length).toFixed(2) : '0';
  const passedCount = reportMarks.filter(m => m.passed).length;
  const overallPass = reportMarks.length > 0 && passedCount === reportMarks.length;

  const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', label: 'Subject Overview', icon: BarChart3 },
    { key: 'reportcard', label: 'Student Report Card', icon: User },
    { key: 'weak', label: 'Weak Students', icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" /><span>Loading reports…</span>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: 6 }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Subject Overview ── */}
      {tab === 'overview' && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Subject-wise Average Marks</span>
              <BookOpen size={16} color="var(--primary)" />
            </div>
            <SubjectBarChart data={summary.subjectAverages} />
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Detailed Subject Statistics</span>
            </div>
            {summary.subjectAverages.length === 0 ? (
              <div className="empty-state"><p>No marks data available</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Subject</th>
                      <th>Students</th>
                      <th>Average Marks</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.subjectAverages.map((sa, i) => {
                      const level = sa.averageMarks >= 70 ? 'Excellent' : sa.averageMarks >= 50 ? 'Good' : sa.averageMarks >= 40 ? 'Average' : 'Poor';
                      const cls = sa.averageMarks >= 70 ? 'badge-success' : sa.averageMarks >= 50 ? 'badge-info' : sa.averageMarks >= 40 ? 'badge-warning' : 'badge-danger';
                      return (
                        <tr key={sa.subjectId}>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>{sa.subjectName}</td>
                          <td>{sa.totalStudents}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 80, height: 6,
                                background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${sa.averageMarks}%`, height: '100%',
                                  background: sa.averageMarks >= 70 ? 'var(--success)' : sa.averageMarks >= 50 ? 'var(--info)' : 'var(--danger)',
                                  borderRadius: 3
                                }} />
                              </div>
                              <strong>{sa.averageMarks}</strong>
                            </div>
                          </td>
                          <td><span className={`badge ${cls}`}>{level}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top 10 */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top 10 Students</span>
              <Award size={16} color="var(--warning)" />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Average</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((ts, i) => (
                    <tr key={ts.studentId}>
                      <td>
                        <span className={`badge ${i === 0 ? 'badge-warning' : i === 1 ? 'badge-gray' : 'badge-primary'}`}>
                          #{ts.rank}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{ts.studentName}</td>
                      <td><span className="badge badge-info">{ts.department}</span></td>
                      <td>Sem {ts.semester}</td>
                      <td style={{ fontWeight: 600 }}>{ts.averageMarks}</td>
                      <td>
                        <span style={{
                          color: ts.percentage >= 70 ? 'var(--success)' : ts.percentage >= 50 ? 'var(--warning)' : 'var(--danger)',
                          fontWeight: 600
                        }}>
                          {ts.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Student Report Card ── */}
      {tab === 'reportcard' && (
        <div>
          <div className="card mb-4">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Select Student</label>
                <select
                  className="form-control"
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.department} (Sem {s.semester})</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={loadReport}
                disabled={!selectedStudent || reportLoading}
                style={{ marginBottom: 0, height: 36 }}
              >
                <Search size={14} /> View Report
              </button>
            </div>
          </div>

          {reportLoading && (
            <div className="loading-overlay"><div className="spinner" /></div>
          )}

          {!reportLoading && selectedStudent && reportMarks.length > 0 && student && (
            <div className="card">
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                borderRadius: 8, padding: '20px 24px', marginBottom: 20, color: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{student.name}</h2>
                    <div style={{ fontSize: 13, opacity: .85 }}>
                      {student.department} · Semester {student.semester}
                    </div>
                    {student.email && (
                      <div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>{student.email}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 800 }}>{avgMarks}</div>
                    <div style={{ fontSize: 11, opacity: .8 }}>Avg. Marks</div>
                    <span style={{
                      background: overallPass ? '#dcfce7' : '#fee2e2',
                      color: overallPass ? '#15803d' : '#b91c1c',
                      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      display: 'inline-block', marginTop: 4
                    }}>
                      {overallPass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject table */}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Internal (50)</th>
                      <th>External (50)</th>
                      <th>Total (100)</th>
                      <th>%</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportMarks.map(m => (
                      <tr key={m.marksId}>
                        <td style={{ fontWeight: 500 }}>{m.subjectName}</td>
                        <td>{m.internalMarks}</td>
                        <td>{m.externalMarks}</td>
                        <td style={{ fontWeight: 600 }}>{m.totalMarks}</td>
                        <td style={{
                          fontWeight: 600,
                          color: m.percentage >= 70 ? 'var(--success)' : m.percentage >= 40 ? 'var(--warning)' : 'var(--danger)'
                        }}>{m.percentage}%</td>
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

              {/* Summary */}
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: 'var(--surface-2)', borderRadius: 8,
                display: 'flex', gap: 24, fontSize: 13
              }}>
                <span>Subjects: <strong>{reportMarks.length}</strong></span>
                <span>Passed: <strong style={{ color: 'var(--success)' }}>{passedCount}</strong></span>
                <span>Failed: <strong style={{ color: 'var(--danger)' }}>{reportMarks.length - passedCount}</strong></span>
                <span>Total: <strong>{totalMarks}</strong></span>
                <span>Average: <strong>{avgMarks}</strong></span>
              </div>
            </div>
          )}

          {!reportLoading && selectedStudent && reportMarks.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <BookOpen size={40} />
                <p>No marks found for this student</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Weak Students ── */}
      {tab === 'weak' && (
        <div>
          <div className="card mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                Threshold (marks):
              </label>
              <input
                className="form-control"
                type="number" min={0} max={100}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: 90 }}
              />
              <button className="btn btn-primary btn-sm" onClick={refreshWeak}>Apply</button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Students with average below this mark
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} color="var(--danger)" />
                <span className="card-title">
                  Students Below {threshold} Marks ({weakStudents.length})
                </span>
              </div>
              {weakStudents.length > 0 && (
                <span className="badge badge-danger">Requires Attention</span>
              )}
            </div>

            {weakStudents.length === 0 ? (
              <div className="empty-state">
                <AlertTriangle size={40} />
                <p>No students below threshold — great performance!</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Avg Marks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weakStudents.map((s, i) => (
                      <tr key={s.studentId}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{s.studentName}</td>
                        <td><span className="badge badge-info">{s.department}</span></td>
                        <td>Sem {s.semester}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                            {s.averageMarks.toFixed(2)}
                          </span>
                        </td>
                        <td><span className="badge badge-danger">Below Threshold</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
