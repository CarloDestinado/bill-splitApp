import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, authAPI } from '../services/api';
import './Upgrade.css';

function Upgrade() {
  const { user, updateUser, isGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handlePremiumUpgrade = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await userAPI.upgradeToPremium({
        payment_method: 'card',
        payment_token: 'dummy_token',
      });
      updateUser(response.data.user);
      setSuccess('Successfully upgraded to Premium!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestToRegistered = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordData.password !== passwordData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.upgradeToRegistered(passwordData);
      updateUser(response.data.user);
      setSuccess('Successfully upgraded to Registered user!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-page">
      <div className="upgrade-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Upgrade Your Account</h1>
        <p>Get unlimited access to all features</p>
      </div>

      {isGuest && (
        <div className="upgrade-container">
          <div className="upgrade-card guest-upgrade">
            <h2>Step 1: Upgrade to Registered User</h2>
            <p className="upgrade-description">
              As a guest, you have limited access. Upgrade to registered user first.
            </p>
            
            {!showPasswordForm ? (
              <button
                className="btn btn-primary"
                onClick={() => setShowPasswordForm(true)}
              >
                Upgrade to Registered
              </button>
            ) : (
              <form onSubmit={handleGuestToRegistered} className="upgrade-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ password: '', password_confirmation: '' });
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="upgrade-container">
        <div className="plan-card current">
          <h2>Current Plan</h2>
          <div className="plan-name">{user?.account_type === 'premium' ? 'Premium' : user?.user_type === 'guest' ? 'Guest' : 'Standard'}</div>
          <div className="plan-price">{user?.account_type === 'premium' ? 'Active' : user?.user_type === 'guest' ? '$0' : '$0'}</div>
          <ul className="plan-features">
            {user?.user_type === 'guest' && (
              <>
                <li>✓ View bills via invitation code</li>
                <li>✓ 6 hours access per day</li>
                <li className="disabled">✗ Create bills</li>
                <li className="disabled">✗ Invite people</li>
                <li className="disabled">✗ Unlimited access</li>
              </>
            )}
            {user?.user_type !== 'guest' && user?.account_type !== 'premium' && (
              <>
                <li>✓ Create up to 5 bills per month</li>
                <li>✓ Add up to 3 people per bill</li>
                <li>✓ Invitation code system</li>
                <li>✓ 6 hours guest access per day</li>
                <li className="disabled">✗ Unlimited bills</li>
                <li className="disabled">✗ Unlimited people per bill</li>
                <li className="disabled">✗ Priority support</li>
              </>
            )}
            {user?.account_type === 'premium' && (
              <>
                <li>✓ Unlimited bills</li>
                <li>✓ Unlimited people per bill</li>
                <li>✓ Priority support</li>
                <li>✓ All premium features</li>
              </>
            )}
          </ul>
        </div>

        {user?.account_type !== 'premium' && (
          <div className="plan-card premium">
            <div className="popular-badge">Most Popular</div>
            <h2>Premium</h2>
            <div className="plan-name">Premium Account</div>
            <div className="plan-price">$9.99<span>/month</span></div>
            <ul className="plan-features">
              <li>✓ <strong>Unlimited bills</strong> (no monthly limit)</li>
              <li>✓ <strong>Unlimited people</strong> per bill</li>
              <li>✓ Priority support</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Custom reminders</li>
              <li>✓ Export to CSV/PDF</li>
            </ul>
            <form onSubmit={handlePremiumUpgrade}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="upgrade-btn" disabled={loading}>
                {loading ? 'Processing...' : 'Upgrade to Premium'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upgrade;
