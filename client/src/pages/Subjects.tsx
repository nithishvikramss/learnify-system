import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Plus, Trash2, X, Save, Edit2 } from 'lucide-react';
import {
  getAllSubjects, addSubject, updateSubject, deleteSubject, getErrorMessage, getFieldErrors, getErrorStatus
} from '../api/api';
import type { Subject } from '../types';
import FieldError from '../components/FieldError';
import { getSession, isAdmin } from '../auth/session';
import { validateSubject, hasErrors, type FieldErrors } from '../utils/validation';

const emptyForm = (): Subject => ({ name: '', code: '', maxMarks: 100 });

export default function Subjects() {
  const canEdit = isAdmin(getSession());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [form, setForm] = useState<Subject>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAllSubjects()
      .then(data => { if (active) setSubjects(data); })
      .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load subjects') }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const load = () => {
    setLoading(true);
    setReloadKey(k => k + 1);
  };

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditTarget(s);
    setForm({ ...s });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateSubject(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      if (editTarget?.id) {
        await updateSubject(editTarget.id, form);
        showAlert('success', 'Subject updated');
      } else {
        await addSubject(form);
        showAlert('success', 'Subject added');
      }
      setShowModal(false);
      setForm(emptyForm());
      load();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showAlert('error', getErrorMessage(err, 'Failed to save subject'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"?`)) return;
    try {
      await deleteSubject(id);
      showAlert('success', `${name} deleted`);
      load();
    } catch (err) {
      // 409 = the subject still has marks; ask before deleting them too
      if (getErrorStatus(err) === 409 && confirm(`${getErrorMessage(err)}\n\nThis cannot be undone.`)) {
        try {
          await deleteSubject(id, true);
          showAlert('success', `${name} and its records deleted`);
          load();
        } catch (err2) {
          showAlert('error', getErrorMessage(err2, 'Delete failed'));
        }
      } else if (getErrorStatus(err) !== 409) {
        showAlert('error', getErrorMessage(err, 'Delete failed'));
      }
    }
  };

  return (
    <div className="page-content">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color="var(--primary)" />
            <span className="section-title">Subjects ({subjects.length})</span>
          </div>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={14} /> Add Subject
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" /><span>Loading…</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={40} />
            <p>No subjects yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject Name</th>
                  <th>Code</th>
                  <th>Max Marks</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td><span className="badge badge-primary">{s.code}</span></td>
                    <td>{s.maxMarks}</td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" title="Edit" onClick={() => openEdit(s)}>
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm btn-icon"
                            title="Delete"
                            onClick={() => handleDelete(s.id!, s.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editTarget ? 'Edit Subject' : 'Add Subject'}</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject Name *</label>
                  <input
                    className={`form-control${fieldErrors.name ? ' invalid' : ''}`}
                    placeholder="e.g. Mathematics"
                    maxLength={100}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Subject Code *</label>
                    <input
                      className={`form-control${fieldErrors.code ? ' invalid' : ''}`}
                      placeholder="e.g. MATH101"
                      maxLength={15}
                      value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    />
                    <FieldError message={fieldErrors.code} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Marks</label>
                    <input
                      className={`form-control${fieldErrors.maxMarks ? ' invalid' : ''}`}
                      type="number"
                      min={1}
                      max={200}
                      value={form.maxMarks}
                      onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) }))}
                    />
                    <FieldError message={fieldErrors.maxMarks} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving…</> : <><Save size={14} /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
