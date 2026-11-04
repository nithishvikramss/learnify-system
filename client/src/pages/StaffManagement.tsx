import { useEffect, useState, type FormEvent } from 'react';
import { UserCog, UserPlus, X, Save, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { getUsers, createUser, setUserDisabled, deleteUser, getErrorMessage, getFieldErrors } from '../api/api';
import type { NewStaffUser, StaffUser } from '../types';
import FieldError from '../components/FieldError';
import { validateNewStaff, hasErrors, type FieldErrors } from '../utils/validation';
import { getSession } from '../auth/session';

const emptyForm = (): NewStaffUser => ({ username: '', fullName: '', password: '' });

/** Admin-only page: lists staff accounts, creates teachers, disables and re-enables them. */
export default function StaffManagement() {
  const currentUser = getSession()?.username;
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewStaffUser>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    let active = true;
    getUsers()
      .then(data => { if (active) setUsers(data); })
      .catch(err => { if (active) setAlert({ type: 'error', msg: getErrorMessage(err, 'Failed to load staff') }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const reload = () => {
    setLoading(true);
    setReloadKey(k => k + 1);
  };

  const openAdd = () => {
    setForm(emptyForm());
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateNewStaff(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await createUser(form);
      showAlert('success', `Teacher account ${form.username.trim().toLowerCase()} created`);
      setShowModal(false);
      reload();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      showAlert('error', getErrorMessage(err, 'Could not create the account'));
    } finally {
      setSaving(false);
    }
  };

  const toggleDisabled = async (user: StaffUser) => {
    const action = user.disabled ? 'Enable' : 'Disable';
    if (!confirm(`${action} the account "${user.username}"?`)) return;
    try {
      await setUserDisabled(user.id, !user.disabled);
      showAlert('success', `${user.username} ${user.disabled ? 'enabled' : 'disabled'}`);
      reload();
    } catch (err) {
      showAlert('error', getErrorMessage(err, `${action} failed`));
    }
  };

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`Permanently delete the account "${user.username}"?`)) return;
    try {
      await deleteUser(user.id);
      showAlert('success', `${user.username} deleted`);
      reload();
    } catch (err) {
      showAlert('error', getErrorMessage(err, 'Delete failed'));
    }
  };

  return (
    <div className="page-content">
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCog size={18} color="var(--primary)" />
            <span className="section-title">Staff Accounts ({users.length})</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <UserPlus size={14} /> Add Teacher
          </button>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Username</th><th>Full Name</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><code className="reg-no">{u.username}</code></td>
                    <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                    <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>{u.role === 'ADMIN' ? 'Administrator' : 'Teacher'}</span></td>
                    <td><span className={`badge ${u.disabled ? 'badge-danger' : 'badge-success'}`}>{u.disabled ? 'Disabled' : 'Active'}</span></td>
                    <td>
                      {u.role === 'TEACHER' && u.username !== currentUser ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => toggleDisabled(u)}>
                            {u.disabled ? <><CheckCircle size={13} /> Enable</> : <><Ban size={13} /> Disable</>}
                          </button>
                          <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(u)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Add Teacher Account</span>
              <button className="btn btn-secondary btn-sm btn-icon" aria-label="Close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="staff-name">Full Name *</label>
                  <input id="staff-name" className={`form-control${fieldErrors.fullName ? ' invalid' : ''}`} maxLength={100}
                    value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                  <FieldError message={fieldErrors.fullName} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="staff-username">Username *</label>
                  <input id="staff-username" className={`form-control${fieldErrors.username ? ' invalid' : ''}`} maxLength={50} autoComplete="off"
                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                  <FieldError message={fieldErrors.username} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="staff-password">Initial Password *</label>
                  <input id="staff-password" type="password" className={`form-control${fieldErrors.password ? ' invalid' : ''}`} maxLength={72} autoComplete="new-password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <FieldError message={fieldErrors.password} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
