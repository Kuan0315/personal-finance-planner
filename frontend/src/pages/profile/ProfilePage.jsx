import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser, isValidEmail, setStoredUser, updateStoredUser } from '../../utils/session'
import './ProfilePage.css'

const ProfilePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    dob: user?.dob || '', occupation: user?.occupation || '', address: user?.address || '',
    city: user?.city || '', country: user?.country || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!profileData.name)               { setError('Name is required.');                     return; }
    if (!isValidEmail(profileData.email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      const rememberSession = Boolean(localStorage.getItem('user'));
      const newUser = updateStoredUser(profileData) || { ...user, ...profileData };
      setStoredUser(newUser, rememberSession);
      setUser(newUser);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Update failed.');
    } finally { setLoading(false); }
  };

  const handleLogout = () => { clearStoredUser(); navigate('/login'); };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      clearStoredUser(); navigate('/register');
    } catch (err) { alert(err.message || 'Delete failed.'); }
  };

  const inputStyle = {
    width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
    padding: '10px 12px', fontFamily: 'var(--font-b)', fontSize: '.9rem',
    color: 'var(--text-dark)', outline: 'none', background: '#fff', transition: 'border-color .2s',
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title">Profile Management</h1>
        <button onClick={handleLogout}
          style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-b)', fontSize: '.9rem' }}
          onMouseEnter={e => e.currentTarget.style.background = '#cc0000'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
        >Logout</button>
      </div>

      {/* Alert */}
      <div className="alert-banner mb-4">
        <i className="bi bi-info-circle-fill me-2"></i>
        <span><strong>Welcome back!</strong> Your profile is up to date.</span>
      </div>

      {/* Summary cards — equal CSS grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="summary-card summary-blue">
          <p className="summary-label">Account Status</p>
          <h2 className="summary-value">Active</h2>
          <p className="summary-sub">Premium Plan</p>
        </div>
        <div className="summary-card summary-green">
          <p className="summary-label">Profile Completion</p>
          <h2 className="summary-value">85%</h2>
          <p className="summary-sub">Add phone number</p>
        </div>
        <div className="summary-card summary-orange">
          <p className="summary-label">Last Login</p>
          <h2 className="summary-value">Today</h2>
          <p className="summary-sub">Secure session</p>
        </div>
        <div className="summary-card summary-purple">
          <p className="summary-label">Goals Linked</p>
          <h2 className="summary-value">7</h2>
          <p className="summary-sub">Active goals</p>
        </div>
      </div>

      {error   && <div style={{ color: 'var(--red)',   marginBottom: 16, fontSize: '.9rem' }}>{error}</div>}
      {success && <div style={{ color: 'var(--green)', marginBottom: 16, fontSize: '.9rem' }}>{success}</div>}

      {/* Form + Actions — CSS grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' }}>
        {/* Left: form */}
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '24px', boxShadow: 'var(--shadow)' }}>
          <h5 style={{ fontFamily: 'var(--font-h)', fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-dark)' }}>Profile Information</h5>
          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name',    key: 'name',       type: 'text' },
              { label: 'Email',        key: 'email',      type: 'email' },
              { label: 'Phone Number', key: 'phone',      type: 'tel' },
              { label: 'Date of Birth',key: 'dob',        type: 'date' },
              { label: 'Occupation',   key: 'occupation', type: 'text' },
              { label: 'Address',      key: 'address',    type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '6px', fontSize: '.9rem' }}>{label}</label>
                <input
                  type={type} style={inputStyle} value={profileData[key]}
                  onChange={e => setProfileData({ ...profileData, [key]: e.target.value })}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}
            {/* City + Country row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {[{ label: 'City', key: 'city' }, { label: 'Country', key: 'country' }].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: 500, color: 'var(--text-dark)', marginBottom: '6px', fontSize: '.9rem' }}>{label}</label>
                  <input
                    type="text" style={inputStyle} value={profileData[key]}
                    onChange={e => setProfileData({ ...profileData, [key]: e.target.value })}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary-action" disabled={loading} style={{ borderRadius: 'var(--r-sm)', padding: '10px 24px' }}>
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Right: account actions */}
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: '24px', boxShadow: 'var(--shadow)' }}>
          <h5 style={{ fontFamily: 'var(--font-h)', fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-dark)' }}>Account Actions</h5>
          <button onClick={() => navigate('/change-password')}
            style={{ width: '100%', background: 'var(--orange)', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-b)', fontSize: '.9rem', marginBottom: '12px' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e07612'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--orange)'}
          >Change Password</button>
          <button onClick={handleDeleteAccount}
            style={{ width: '100%', background: 'var(--red)', color: '#fff', border: 'none', padding: '12px 16px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-b)', fontSize: '.9rem' }}
            onMouseEnter={e => e.currentTarget.style.background = '#cc0000'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
          >Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage
