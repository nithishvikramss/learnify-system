import { useEffect, useState, type FormEvent } from 'react';
import { ClipboardList, Plus, X, CheckCircle, Edit2, Trash2, Save, Search } from 'lucide-react';
import {
  getAllStudents, getAllSubjects, addMarks, getMarksPage, updateMarks, deleteMarks, getErrorMessage
} from '../api/api';
import type { Student, Subject, Marks, MarksDetail } from '../types';
import Pagination from '../components/Pagination';

/** A subject is passed with at least 40% of its max marks (same rule as the backend). */
const PASS_PERCENTAGE = 40;

type Entry = { subjectId: string; internal: string; external: string };

/** Returns an error message for a row of marks, or '' if it is valid. */
function validateScores(internal: string, external: string, maxMarks: number): string {
  if (internal === '' || external === '') return 'Enter both internal and external marks';
  const i = Number(internal), ex = Number(external);
  if (!Number.isFinite(i) || !Number.isFinite(ex)) return 'Marks must be numbers';
  if (i < 0 || ex < 0) return 'Marks cannot be negative';
  if (i + ex > maxMarks) return `Total cannot exceed ${maxMarks}`;
  return '';
}

export default function MarksEntry() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marksRows, setMarksRows] = useState<MarksDetail[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [entries, setEntries] = useState<Entry[]>([
    { subjectId: '', internal: '', external: '' }
  ]);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  // Table filters (applied to the loaded records)
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [resultFilter, setResultFilter] = useState<'' | 'pass' | 'fail'>('');

  const [editTarget, setEditTarget] = useState<MarksDetail | null>(null);
  const [editScores, setEditScores] = useState({ internal: '', external: '' });
  const [editError, setEditError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  // Students and subjects for the pickers
  useEffect(() => {
    let active = true;
    Promise.all([getAllStudents(), getAllSubjects()])
      .then(([s, sub]) => {
        if (!active) return;
        setStudents(s);
        setSubjects(sub);
      })
      .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load data') }); });
    return () => { active = false; };
  }, [reloadKey]);

  // One page of marks. The short delay avoids a request for every keystroke while searching.
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getMarksPage({
        page, size,
        search: search.trim() || undefined,
        subjectId: subjectFilter || undefined,
        result: resultFilter || undefined,
      })
        .then(data => {
          if (!active) return;
          if (data.content.length === 0 && page > 0) {
            setPage(page - 1);
            return;
          }
          setMarksRows(data.content);
          setTotalElements(data.totalElements);
          setTotalPages(data.totalPages);
        })
        .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load marks') }); })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [page, size, search, subjectFilter, resultFilter, reloadKey]);

  const changeFilter = <T,>(setter: (value: T) => void, value: T) => {
    setPage(0);
    setter(value);
  };

  const load = () => {
    setLoading(true);
    setReloadKey(k => k + 1);
  };

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openModal = () => {
    setSelectedStudent('');
    setEntries([{ subjectId: '', internal: '', external: '' }]);
    setRowErrors([]);
    setShowModal(true);
  };

  const addEntry = () => setEntries(e => [...e, { subjectId: '', internal: '', external: '' }]);
  const removeEntry = (i: number) => {
    setEntries(e => e.filter((_, idx) => idx !== i));
    setRowErrors(r => r.filter((_, idx) => idx !== i));
  };

  const maxFor = (subjectId: string) => subjects.find(s => s.id === subjectId)?.maxMarks ?? 100;

  const updateEntry = (i: number, field: string, value: string) => {
    setEntries(e => e.map((entry, idx) => idx === i ? { ...entry, [field]: value } : entry));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { showAlert('error', 'Select a student'); return; }
    const errors = entries.map((en, i) => {
      if (!en.subjectId) return 'Select a subject';
      if (entries.findIndex(other => other.subjectId === en.subjectId) !== i) return 'Subject already listed above';
      return validateScores(en.internal, en.external, maxFor(en.subjectId));
    });
    setRowErrors(errors);
    if (errors.some(Boolean)) return;

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
    } catch (err) {
      showAlert('error', getErrorMessage(err, 'Failed to save marks'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (m: MarksDetail) => {
    setEditTarget(m);
    setEditScores({ internal: String(m.internalMarks), external: String(m.externalMarks) });
    setEditError('');
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const error = validateScores(editScores.internal, editScores.external, editTarget.maxMarks);
    setEditError(error);
    if (error) return;

    setSaving(true);
    try {
      await updateMarks(editTarget.marksId, {
        internalMarks: Number(editScores.internal),
        externalMarks: Number(editScores.external),
      });
      showAlert('success', `Marks updated for ${editTarget.studentName} — ${editTarget.subjectName}`);
      setEditTarget(null);
      load();
    } catch (err) {
      setEditError(getErrorMessage(err, 'Failed to update marks'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: MarksDetail) => {
    if (!confirm(`Delete ${m.subjectName} marks for ${m.studentName}?`)) return;
    try {
      await deleteMarks(m.marksId);
      showAlert('success', 'Marks deleted');
      load();
    } catch (err) {
      showAlert('error', getErrorMessage(err, 'Delete failed'));
    }
  };

  const getTotal = (en: Entry) => {
    const i = Number(en.internal), ex = Number(en.external);
    return isNaN(i) || isNaN(ex) || en.internal === '' || en.external === '' ? null : i + ex;
  };

  const hasFilters = Boolean(search.trim() || subjectFilter || resultFilter);

  return (
    <div className="page-content">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={18} color="var(--primary)" />
            <span className="section-title">
              Marks Entry ({totalElements} records)
            </span>
          </div>
          <div className="toolbar">
            <select className="form-control" value={subjectFilter} onChange={e => changeFilter(setSubjectFilter, e.target.value)} aria-label="Filter by subject">
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="form-control" value={resultFilter} onChange={e => changeFilter(setResultFilter, e.target.value as '' | 'pass' | 'fail')} aria-label="Filter by result">
              <option value="">All results</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </select>
            <div className="search-bar">
              <Search size={14} />
              <input
                placeholder="Search student or register no…"
                value={search}
                onChange={e => changeFilter(setSearch, e.target.value)}
                aria-label="Search marks by student"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={openModal} disabled={!students.length || !subjects.length}>
              <Plus size={14} /> Enter Marks
            </button>
          </div>
        </div>

        {(!students.length || !subjects.length) && !loading && (
          <div className="alert alert-error" style={{ marginTop: 0 }}>
            Please add students and subjects before entering marks.
          </div>
        )}

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>
        ) : marksRows.length === 0 && !hasFilters ? (
          <div className="empty-state">
            <ClipboardList size={40} />
            <p>No marks entered yet.</p>
          </div>
        ) : marksRows.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <p>No marks match your filters.</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {marksRows.map(m => (
                  <tr key={m.marksId}>
                    <td style={{ fontWeight: 500 }}>{m.studentName}</td>
                    <td><span className="badge badge-info">{m.department}</span></td>
                    <td>{m.subjectName}</td>
                    <td>{m.internalMarks}</td>
                    <td>{m.externalMarks}</td>
                    <td style={{ fontWeight: 600 }}>{m.totalMarks} / {m.maxMarks}</td>
                    <td style={{ fontWeight: 500 }}>{m.percentage}%</td>
                    <td>
                      <span className={`badge ${m.passed ? 'badge-success' : 'badge-danger'}`}>
                        {m.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" title="Edit" onClick={() => openEdit(m)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(m)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page} size={size} totalElements={totalElements} totalPages={totalPages}
              onPageChange={setPage}
              onSizeChange={n => { setPage(0); setSize(n); }}
            />
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
            <form onSubmit={handleSubmit} noValidate>
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
                      <option key={s.id} value={s.id}>{s.registerNumber ? `${s.registerNumber} · ` : ''}{s.name} — {s.department} (Sem {s.semester})</option>
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
                    const max = maxFor(en.subjectId);
                    const passed = total !== null && (total / max) * 100 >= PASS_PERCENTAGE;
                    return (
                      <div key={i} style={{ marginBottom: 8 }}>
                      <div className="marks-row">
                        <select
                          className="form-control"
                          value={en.subjectId}
                          onChange={e => updateEntry(i, 'subjectId', e.target.value)}
                          required
                        >
                          <option value="">Subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (max {s.maxMarks})</option>
                          ))}
                        </select>
                        <input
                          className="form-control"
                          type="number" min={0} max={max}
                          placeholder="Int."
                          value={en.internal}
                          onChange={e => updateEntry(i, 'internal', e.target.value)}
                          required
                        />
                        <input
                          className="form-control"
                          type="number" min={0} max={max}
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
                      {rowErrors[i] && <div className="field-error">{rowErrors[i]}</div>}
                      </div>
                    );
                  })}

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Pass: {PASS_PERCENTAGE}% of the subject's max marks · Internal + External must not exceed the max
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

      {/* Edit single marks record */}
      {editTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Edit Marks</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditTarget(null)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEditSave} noValidate>
              <div className="modal-body">
                <p style={{ fontSize: 13, marginBottom: 12 }}>
                  <strong>{editTarget.studentName}</strong> — {editTarget.subjectName} (max {editTarget.maxMarks})
                </p>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Internal</label>
                    <input
                      className="form-control" type="number" min={0} max={editTarget.maxMarks}
                      value={editScores.internal}
                      onChange={e => setEditScores(s => ({ ...s, internal: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">External</label>
                    <input
                      className="form-control" type="number" min={0} max={editTarget.maxMarks}
                      value={editScores.external}
                      onChange={e => setEditScores(s => ({ ...s, external: e.target.value }))}
                    />
                  </div>
                </div>
                {editError && <div className="field-error">{editError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
