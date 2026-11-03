import { useEffect, useState, type FormEvent } from 'react';
import {
  UserPlus, Search, Trash2, Edit2, X, Users, Save, Eye
} from 'lucide-react';
import {
  getAllStudents, addStudent, updateStudent, deleteStudent, getErrorMessage, getFieldErrors
} from '../api/api';
import type { Student } from '../types';
import FieldError from '../components/FieldError';
import StudentDetailsModal from '../components/StudentDetailsModal';
import { getSession, isAdmin } from '../auth/session';
import { validateStudent, hasErrors, type FieldErrors } from '../utils/validation';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyForm = (): Student => ({ name: '', registerNumber: '', department: '', semester: 1, email: '' });

export default function StudentManagement() {
  const canEdit = isAdmin(getSession());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [viewTarget, setViewTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<Student>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [query, setQuery] = useState(''); // search term sent to the server
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAllStudents(query ? { search: query } : {})
      .then(data => { if (active) setStudents(data); })
      .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load students') }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, reloadKey]);

  const reload = () => {
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

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({ ...s, email: s.email ?? '', registerNumber: s.registerNumber ?? '' });
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateStudent(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      if (editTarget?.id) {
        await updateStudent(editTarget.id, form);
        showAlert('success', 'Student updated successfully');
      } else {
        await addStudent(form);
        showAlert('success', 'Student added successfully');
      }
      setShowModal(false);
      reload();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showAlert('error', getErrorMessage(err, 'Could not save student'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"? This will also remove their marks.`)) return;
    try {
      await deleteStudent(id);
      showAlert('success', `${name} deleted`);
      reload();
    } catch (err) {
      showAlert('error', getErrorMessage(err, 'Delete failed'));
    }
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    if (q.length === 0 || q.length >= 2) {
      setLoading(true);
      setQuery(q);
    }
  };

  // Search runs on the server; department/semester filters are applied to the loaded list.
  const filtered = students.filter(s =>
    (!deptFilter || s.department === deptFilter) &&
    (!semFilter || s.semester === Number(semFilter))
  );

  return (
    <div className="page-content">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.msg}
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--primary)" />
            <span className="section-title">Students ({filtered.length})</span>
          </div>
          <div className="toolbar">
            <select className="form-control" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} aria-label="Filter by department">
              <option value="">All departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="form-control" value={semFilter} onChange={e => setSemFilter(e.target.value)} aria-label="Filter by semester">
              <option value="">All semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <div className="search-bar">
              <Search size={14} />
              <input
                placeholder="Search name or register no…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
              {search && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                  onClick={() => handleSearch('')}
                >
                  <X size={12} color="var(--text-muted)" />
                </button>
              )}
            </div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <UserPlus size={14} /> Add Student
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" />
            <span>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p>{search || deptFilter || semFilter ? 'No students match your filters' : 'No students yet. Add one to get started.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Reg. No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td><code className="reg-no">{s.registerNumber || '—'}</code></td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                    <td><span className="badge badge-info">{s.department}</span></td>
                    <td><span className="badge badge-primary">Sem {s.semester}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          title="View details"
                          onClick={() => setViewTarget(s)}
                        >
                          <Eye size={13} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              title="Edit"
                              onClick={() => openEdit(s)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              title="Delete"
                              onClick={() => handleDelete(s.id!, s.name)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewTarget && (
        <StudentDetailsModal key={viewTarget.id} student={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editTarget ? 'Edit Student' : 'Add Student'}</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className={`form-control${fieldErrors.name ? ' invalid' : ''}`}
                      placeholder="e.g. Arun Kumar"
                      maxLength={100}
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <FieldError message={fieldErrors.name} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Register Number *</label>
                    <input
                      className={`form-control${fieldErrors.registerNumber ? ' invalid' : ''}`}
                      placeholder="e.g. 21CS001"
                      maxLength={20}
                      value={form.registerNumber}
                      onChange={e => setForm(f => ({ ...f, registerNumber: e.target.value.toUpperCase() }))}
                    />
                    <FieldError message={fieldErrors.registerNumber} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-control${fieldErrors.email ? ' invalid' : ''}`}
                    type="email"
                    placeholder="student@example.com"
                    maxLength={120}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className={`form-control${fieldErrors.department ? ' invalid' : ''}`}
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <FieldError message={fieldErrors.department} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <select
                      className="form-control"
                      value={form.semester}
                      onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}
                      required
                    >
                      {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    <FieldError message={fieldErrors.semester} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
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
