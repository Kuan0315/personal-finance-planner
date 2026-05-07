import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, isStrongPassword, isValidEmail, loginUser, registerUser } from '../../utils/session'
import './AuthShared.css'

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', agreeTerms: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (getStoredUser()?.email) navigate('/'); }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name)                              { setError('Please enter your full name.');                                          return; }
    if (!isValidEmail(formData.email))               { setError('Please enter a valid email address.');                                  return; }
    if (!isStrongPassword(formData.password))        { setError('Password must be at least 8 characters and include a letter and a number.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.');                                           return; }
    if (!formData.agreeTerms)                        { setError('You must agree to the terms.');                                         return; }
    setLoading(true);
    try {
      registerUser({ name: formData.name, email: formData.email });
      loginUser({ name: formData.name, email: formData.email, rememberMe: true });
      navigate('/');
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header"><h2>Create Account</h2><p>Start managing your finances today</p></div>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
            <div className="form-group"><label>Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" /></div>
            <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Enter your email" /></div>
            <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Create a password" minLength="8" /></div>
            <div className="form-group"><label>Confirm Password</label><input type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Confirm your password" /></div>
            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.agreeTerms} onChange={e => setFormData({ ...formData, agreeTerms: e.target.checked })} />
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
          </form>
          <div className="auth-footer"><p>Already have an account? <a href="/login">Sign in</a></p></div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage
