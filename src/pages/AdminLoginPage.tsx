import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '@/utils/adminApi';
import '@/styles/admin.css';

const CMS_AUTH_DISABLED = import.meta.env.VITE_CMS_AUTH_DISABLED === 'true';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (CMS_AUTH_DISABLED) navigate('/admin', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (CMS_AUTH_DISABLED) {
    return (
      <main className="admin-login-page">
        <p className="admin-loading">Opening CMS…</p>
      </main>
    );
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p>Enter the admin password.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
