import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCheck, Save, XCircle } from 'lucide-react';
import {
  getAllStudents, getAllSubjects, getAttendanceSheet, saveAttendanceSheet, getErrorMessage
} from '../api/api';
import type { Student, Subject } from '../types';

/** Today's date in the browser's own time zone, as yyyy-MM-dd. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Mark present/absent for every student in a subject on a date. Saving again updates that date. */
export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(today());
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getAllStudents(), getAllSubjects()])
      .then(([s, sub]) => {
        if (!active) return;
        setStudents(s);
        setSubjects(sub);
      })
      .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load data') }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Load what is already recorded for this subject and date
  useEffect(() => {
    if (!subjectId || !date) return;
    let active = true;
    getAttendanceSheet(subjectId, date)
      .then(records => {
        if (!active) return;
        setPresent(Object.fromEntries(records.map(r => [r.studentId, r.present])));
        setSavedIds(new Set(records.map(r => r.studentId)));
      })
      .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load attendance') }); })
      .finally(() => { if (active) setSheetLoading(false); });
    return () => { active = false; };
  }, [subjectId, date]);

  const roster = students.filter(s =>
    (!department || s.department === department) && (!semester || s.semester === Number(semester))
  );
  const departments = [...new Set(students.map(s => s.department))].sort();
  const semesters = [...new Set(students.map(s => s.semester))].sort((a, b) => a - b);

  // A student without a saved record counts as present until changed
  const isPresent = (id: string) => present[id] ?? true;
  const presentCount = roster.filter(s => isPresent(s.id!)).length;
  const savedCount = roster.filter(s => savedIds.has(s.id!)).length;

  const markAll = (value: boolean) =>
    setPresent(p => ({ ...p, ...Object.fromEntries(roster.map(s => [s.id!, value])) }));

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      await saveAttendanceSheet({
        subjectId, date,
        entries: roster.map(s => ({ studentId: s.id!, present: isPresent(s.id!) })),
      });
      setSavedIds(ids => new Set([...ids, ...roster.map(s => s.id!)]));
      setAlert({ type: 'success', msg: `Attendance saved for ${roster.length} student(s) on ${date}` });
    } catch (err) {
      setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to save attendance') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>;
  }

  return (
    <div className="page-content">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarCheck size={18} color="var(--primary)" />
            <span className="section-title">Attendance</span>
          </div>
          <div className="toolbar">
            <select className="form-control" aria-label="Subject" value={subjectId}
              onChange={e => { setSheetLoading(true); setPresent({}); setSubjectId(e.target.value); }}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input className="form-control" type="date" aria-label="Date" max={today()} value={date}
              onChange={e => { setSheetLoading(Boolean(subjectId && e.target.value)); setPresent({}); setDate(e.target.value); }} />
            <select className="form-control" aria-label="Filter by department" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="form-control" aria-label="Filter by semester" value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="">All semesters</option>
              {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>

        {!subjectId || !date ? (
          <div className="empty-state">
            <CalendarCheck size={40} />
            <p>Select a subject and a date to take attendance.</p>
          </div>
        ) : sheetLoading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>
        ) : roster.length === 0 ? (
          <div className="empty-state"><p>No students match these filters.</p></div>
        ) : (
          <>
            <div className="attendance-actions">
              <span className={`badge ${savedCount === roster.length ? 'badge-success' : 'badge-warning'}`}>
                {savedCount === 0 ? 'Not saved yet'
                  : savedCount === roster.length ? 'Saved for this date'
                  : `Saved for ${savedCount} of ${roster.length} students`}
              </span>
              <span>Present: <strong>{presentCount}</strong> / {roster.length}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => markAll(true)}><CheckCheck size={13} /> All present</button>
              <button className="btn btn-secondary btn-sm" onClick={() => markAll(false)}><XCircle size={13} /> All absent</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Reg. No</th><th>Name</th><th>Department</th><th>Semester</th><th>Attendance</th></tr>
                </thead>
                <tbody>
                  {roster.map(s => (
                    <tr key={s.id}>
                      <td><code className="reg-no">{s.registerNumber || '—'}</code></td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td><span className="badge badge-info">{s.department}</span></td>
                      <td>Sem {s.semester}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${isPresent(s.id!) ? 'btn-present' : 'btn-danger'}`}
                          aria-pressed={isPresent(s.id!)}
                          onClick={() => setPresent(p => ({ ...p, [s.id!]: !isPresent(s.id!) }))}
                        >
                          {isPresent(s.id!) ? 'Present' : 'Absent'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="attendance-save">
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
