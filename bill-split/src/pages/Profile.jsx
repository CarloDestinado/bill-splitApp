import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import './Profile.css';

function Profile() {
  const { user, updateUser, upgradeToRegistered, isGuest } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordData.password !== passwordData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await upgradeToRegistered(passwordData);
      setSuccess('Account upgraded successfully!');
      setShowPasswordForm(false);
      setPasswordData({ password: '', password_confirmation: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>My Profile</h1>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <h2>Account Information</h2>
          <div className="account-info">
            <div className="info-row">
              <span className="label">Account Type:</span>
              <span className={`badge ${user?.account_type}`}>
                {user?.account_type}
              </span>
            </div>
            <div className="info-row">
              <span className="label">User Type:</span>
              <span className={`badge ${user?.user_type}`}>
                {user?.user_type}
              </span>
            </div>
            {user?.user_type === 'guest' && (
              <div className="info-row">
                <span className="label">Access Hours Used:</span>
                <span>{user?.access_hours_used || 0}/6 hours</span>
              </div>
            )}
          </div>

          {isGuest && (
            <div className="upgrade-guest-section">
              <h3>Upgrade to Registered User</h3>
              <p>Get full access to all features by setting a password</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Cancel' : 'Upgrade Account'}
              </button>
            </div>
          )}
        </div>

        <div className="profile-card">
          <h2>Personal Information</h2>
          <form onSubmit={handleProfileUpdate}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="First Name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email Address"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {showPasswordForm && isGuest && (
          <div className="profile-card">
            <h2>Upgrade to Registered User</h2>
            <p className="upgrade-description">
              Set a password to upgrade your account. Your existing information (name and email) will be kept.
            </p>
            <form onSubmit={handleUpgrade}>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  placeholder="Password (min 8 characters)"
                  required
                  minLength="8"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  className="input-field"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                  placeholder="Confirm Password"
                  required
                  minLength="8"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Upgrading...' : 'Upgrade to Registered'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
