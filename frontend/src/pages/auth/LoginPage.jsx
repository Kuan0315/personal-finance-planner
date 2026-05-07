import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, isValidEmail, loginUser } from '../../utils/session'
import './LoginPage.css'

// LOGIN PAGE
// ═══════════════════════════════════════════════════════
const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (getStoredUser()?.email) navigate('/'); }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(formData.email)) { setError('Please enter a valid email address.'); return; }
    if (!formData.password)            { setError('Please enter your password.');          return; }
    setLoading(true);
    try {
      loginUser({ name: formData.email.split('@')[0] || 'Demo Investor', email: formData.email, rememberMe: formData.rememberMe });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Sign In</h2>
            <p>Access your financial dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Enter your password" />
            </div>
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.rememberMe} onChange={e => setFormData({ ...formData, rememberMe: e.target.checked })} />
                Remember me
              </label>
              <a href="/forgot-password" className="forgot-link">Forgot password?</a>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          </form>
          <div className="auth-footer"><p>Don't have an account? <a href="/register">Sign up</a></p></div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════

export default LoginPage
