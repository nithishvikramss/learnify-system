import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Lock, User } from 'lucide-react';

const DEMO_USERS = [
  { username: 'admin', password: 'admin123', role: 'Administrator' },
  { username: 'teacher', password: 'teacher123', role: 'Teacher' },
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const match = DEMO_USERS.find(
        u => u.username === username && u.password === password
      );
      if (match) {
        localStorage.setItem('auth', JSON.stringify({ username: match.username, role: match.role }));
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Try admin/admin123 or teacher/teacher123');
      }
      setLoading(false);
    }, 600);
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

        {error && (
          <div className="alert alert-error">
            <Lock size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
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

        <div style={{
          marginTop: 20, padding: 12,
          background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)'
        }}>
          <strong style={{ color: 'var(--text)' }}>Demo Credentials:</strong>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>Admin: admin / admin123</span>
            <span>Teacher: teacher / teacher123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
