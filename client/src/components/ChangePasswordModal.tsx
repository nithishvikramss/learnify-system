import { useState, type FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { changeOwnPassword, getErrorMessage, getFieldErrors } from '../api/api';
import FieldError from './FieldError';
import { validatePasswordChange, hasErrors, type FieldErrors } from '../utils/validation';

/** Lets the logged-in user change their own password. */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validatePasswordChange(form);
    setFieldErrors(errors);
    setError('');
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await changeOwnPassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setDone(true);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'Could not change the password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }} role="dialog" aria-label="Change password">
        <div className="modal-header">
          <span className="modal-title">Change Password</span>
          <button className="btn btn-secondary btn-sm btn-icon" aria-label="Close" onClick={onClose}><X size={14} /></button>
        </div>
        {done ? (
          <div className="modal-body">
            <div className="alert alert-success">Password changed successfully.</div>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="pw-current">Current Password</label>
                <input id="pw-current" type="password" autoComplete="current-password" className={`form-control${fieldErrors.currentPassword ? ' invalid' : ''}`}
                  value={form.currentPassword} onChange={e => set('currentPassword', e.target.value)} />
                <FieldError message={fieldErrors.currentPassword} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pw-new">New Password</label>
                <input id="pw-new" type="password" autoComplete="new-password" maxLength={72} className={`form-control${fieldErrors.newPassword ? ' invalid' : ''}`}
                  value={form.newPassword} onChange={e => set('newPassword', e.target.value)} />
                <FieldError message={fieldErrors.newPassword} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pw-confirm">Confirm New Password</label>
                <input id="pw-confirm" type="password" autoComplete="new-password" maxLength={72} className={`form-control${fieldErrors.confirmPassword ? ' invalid' : ''}`}
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                <FieldError message={fieldErrors.confirmPassword} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> Change Password</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
