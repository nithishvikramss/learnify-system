import { useEffect, useState, type FormEvent } from 'react';
import {
  UserPlus, Search, Trash2, Edit2, X, Users, Save
} from 'lucide-react';
import {
  getAllStudents, addStudent, updateStudent, deleteStudent
} from '../api/api';
import type { Student } from '../types';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyForm = (): Student => ({ name: '', department: '', semester: 1, email: '' });

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<Student>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = (q?: string) => {
    setLoading(true);
    getAllStudents(q ? { search: q } : {})
      .then(setStudents)
      .catch(() => showAlert('error', 'Failed to load students'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setForm({ ...s });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      load(search);
    } catch {
      showAlert('error', 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"? This will also remove their marks.`)) return;
    try {
      await deleteStudent(id);
      showAlert('success', `${name} deleted`);
      load(search);
    } catch {
      showAlert('error', 'Delete failed');
    }
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    if (q.length === 0 || q.length >= 2) load(q);
  };

  const filtered = students; // server-side search applied

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
            <span className="section-title">Students ({students.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search-bar">
              <Search size={14} />
              <input
                placeholder="Search students…"
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
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <UserPlus size={14} /> Add Student
            </button>
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
            <p>{search ? 'No students match your search' : 'No students yet. Add one to get started.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
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
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.email || '—'}</td>
                    <td><span className="badge badge-info">{s.department}</span></td>
                    <td><span className="badge badge-primary">Sem {s.semester}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
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
                      </div>
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
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editTarget ? 'Edit Student' : 'Add Student'}</span>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Arun Kumar"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="student@example.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-control"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      required
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
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
