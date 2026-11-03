import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Lock, User } from 'lucide-react';
import { login, getErrorMessage } from '../api/api';
import { getSession, saveSession } from '../auth/session';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/dashboard';

  if (getSession()) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      saveSession(await login(username.trim(), password));
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              background: 'var(--primary)', borderRadius: 10,
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GraduationCap size={24} color="#fff" />
            </div>
          </div>
          <h1>Learnify Analytics</h1>
          <p>Student Performance Analytics System</p>
        </div>

        {params.get('expired') && !error && (
          <div className="alert alert-info">Your session has expired. Please sign in again.</div>
        )}

        {error && (
          <div className="alert alert-error">
            <Lock size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}>
                <User size={14} />
              </div>
              <input
                className="form-control"
                style={{ paddingLeft: 32 }}
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
                maxLength={50}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}>
                <Lock size={14} />
              </div>
              <input
                className="form-control"
                style={{ paddingLeft: 32, paddingRight: 36 }}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                autoComplete="current-password"
                maxLength={100}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPass ? 'Hide password' : 'Show password'}
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex'
                }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Signing in…</>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="login-footnote">
          Accounts are created by the administrator. Contact them if you cannot sign in.
        </p>
      </div>
    </div>
  );
}
