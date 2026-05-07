import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isStrongPassword } from '../../utils/session'
import './ChangePasswordPage.css'

const ChangePasswordPage = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmNewPassword) { setError('Please fill in all password fields.'); return; }
    if (!isStrongPassword(formData.newPassword)) { setError('New password must be at least 8 characters and include a letter and a number.'); return; }
    if (formData.newPassword !== formData.confirmNewPassword) { setError('New password and confirm password do not match.'); return; }
    setLoading(true);
    try {
      setSuccess('Password changed successfully.');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container auth-container--narrow">
        <div className="auth-card">
          <div className="auth-header"><h2>Change Password</h2><p>Update your password to keep your account secure</p></div>
          <form onSubmit={handleSubmit} className="auth-form">
            {error   && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: '#22c55e', marginBottom: '16px', fontSize: '0.9rem' }}>{success}</div>}
            <div className="form-group"><label>Current Password</label><input type="password" value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} placeholder="Enter current password" autoComplete="current-password" /></div>
            <div className="form-group"><label>New Password</label><input type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} placeholder="Enter new password" autoComplete="new-password" /></div>
            <div className="form-group"><label>Confirm Password</label><input type="password" value={formData.confirmNewPassword} onChange={e => setFormData({ ...formData, confirmNewPassword: e.target.value })} placeholder="Confirm new password" autoComplete="new-password" /></div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => navigate('/profile')} className="btn-modal-cancel" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-modal-save" style={{ flex: 1 }} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage
