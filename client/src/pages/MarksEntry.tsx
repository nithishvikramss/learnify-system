import { useEffect, useState, type FormEvent } from 'react';
import { ClipboardList, Plus, X, CheckCircle } from 'lucide-react';
import {
  getAllStudents, getAllSubjects, addMarks, getAllMarks
} from '../api/api';
import type { Student, Subject, Marks, MarksDetail } from '../types';

const PASS_MARK = 40;

export default function MarksEntry() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allMarks, setAllMarks] = useState<MarksDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [entries, setEntries] = useState<{ subjectId: string; internal: string; external: string }[]>([
    { subjectId: '', internal: '', external: '' }
  ]);

  const load = () => {
    setLoading(true);
    Promise.all([getAllStudents(), getAllSubjects(), getAllMarks()])
      .then(([s, sub, m]) => { setStudents(s); setSubjects(sub); setAllMarks(m); })
      .catch(() => showAlert('error', 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openModal = () => {
    setSelectedStudent('');
    setEntries([{ subjectId: '', internal: '', external: '' }]);
    setShowModal(true);
  };

  const addEntry = () => setEntries(e => [...e, { subjectId: '', internal: '', external: '' }]);
  const removeEntry = (i: number) => setEntries(e => e.filter((_, idx) => idx !== i));

  const updateEntry = (i: number, field: string, value: string) => {
    setEntries(e => e.map((entry, idx) => idx === i ? { ...entry, [field]: value } : entry));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { showAlert('error', 'Select a student'); return; }
    const invalid = entries.some(en => !en.subjectId || en.internal === '' || en.external === '');
    if (invalid) { showAlert('error', 'Fill all fields in each row'); return; }

    setSaving(true);
    try {
      for (const en of entries) {
        const marks: Marks = {
          studentId: selectedStudent,
          subjectId: en.subjectId,
          internalMarks: Number(en.internal),
          externalMarks: Number(en.external),
        };
        await addMarks(marks);
      }
      showAlert('success', `Marks saved for ${entries.length} subject(s)`);
      setShowModal(false);
      load();
    } catch {
      showAlert('error', 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const getTotal = (en: typeof entries[0]) => {
    const i = Number(en.internal), ex = Number(en.external);
    return isNaN(i) || isNaN(ex) || en.internal === '' || en.external === '' ? null : i + ex;
  };

  // Group marks by student for the table
  const byStudent: Record<string, MarksDetail[]> = {};
  allMarks.forEach(m => {
    if (!byStudent[m.studentId]) byStudent[m.studentId] = [];
    byStudent[m.studentId].push(m);
  });

  return (
    <div className="page-content">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={18} color="var(--primary)" />
            <span className="section-title">Marks Entry ({allMarks.length} records)</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openModal} disabled={!students.length || !subjects.length}>
            <Plus size={14} /> Enter Marks
          </button>
        </div>

        {(!students.length || !subjects.length) && !loading && (
          <div className="alert alert-error" style={{ marginTop: 0 }}>
            Please add students and subjects before entering marks.
          </div>
        )}

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>
        ) : allMarks.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={40} />
            <p>No marks entered yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Subject</th>
                  <th>Internal</th>
                  <th>External</th>
                  <th>Total</th>
                  <th>%</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allMarks.map(m => (
                  <tr key={m.marksId}>
                    <td style={{ fontWeight: 500 }}>{m.studentName}</td>
                    <td><span className="badge badge-info">{m.department}</span></td>
                    <td>{m.subjectName}</td>
                    <td>{m.internalMarks}</td>
                    <td>{m.externalMarks}</td>
                    <td style={{ fontWeight: 600 }}>{m.totalMarks}</td>
                    <td style={{ fontWeight: 500 }}>{m.percentage}%</td>
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <span className="modal-title">Enter Marks</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Student *</label>
                  <select
                    className="form-control"
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    required
                  >
                    <option value="">-- Select Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.department} (Sem {s.semester})</option>
                    ))}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Marks per Subject</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addEntry}>
                      <Plus size={12} /> Add Row
                    </button>
                  </div>

                  {entries.map((en, i) => {
                    const total = getTotal(en);
                    const passed = total !== null && total >= PASS_MARK;
                    return (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px auto',
                        gap: 8, marginBottom: 8, alignItems: 'center'
                      }}>
                        <select
                          className="form-control"
                          value={en.subjectId}
                          onChange={e => updateEntry(i, 'subjectId', e.target.value)}
                          required
                        >
                          <option value="">Subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <input
                          className="form-control"
                          type="number" min={0} max={50}
                          placeholder="Int."
                          value={en.internal}
                          onChange={e => updateEntry(i, 'internal', e.target.value)}
                          required
                        />
                        <input
                          className="form-control"
                          type="number" min={0} max={50}
                          placeholder="Ext."
                          value={en.external}
                          onChange={e => updateEntry(i, 'external', e.target.value)}
                          required
                        />
                        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
                          {total !== null ? (
                            <span style={{ color: passed ? 'var(--success)' : 'var(--danger)' }}>
                              {total}
                            </span>
                          ) : '—'}
                        </div>
                        {entries.length > 1 ? (
                          <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeEntry(i)}>
                            <X size={12} />
                          </button>
                        ) : <div />}
                      </div>
                    );
                  })}

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Pass mark: {PASS_MARK}/100 | Internal (max 50) + External (max 50)
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving…</>
                    : <><CheckCircle size={14} /> Save Marks</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
