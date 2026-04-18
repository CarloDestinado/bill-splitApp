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
  const [formData, setFormData] = useState({
    last_name: user?.last_name || "",
    first_name: user?.first_name || "",
    nickname: user?.nickname || "",
    email: user?.email || "",
    username: user?.username || "",
    password: "",
    password_confirmation: "",
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
    setError("");

    // Validate all fields
    if (!formData.first_name || formData.first_name.trim() === "") {
      setError("First name is required");
      return;
    }
    if (formData.first_name.includes(" ")) {
      setError("First name cannot contain spaces");
      return;
    }

    if (!formData.last_name || formData.last_name.trim() === "") {
      setError("Last name is required");
      return;
    }
    if (formData.last_name.includes(" ")) {
      setError("Last name cannot contain spaces");
      return;
    }

    if (!formData.nickname || formData.nickname.trim() === "") {
      setError("Nickname is required");
      return;
    }

    if (!formData.email || formData.email.trim() === "") {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.username || formData.username.trim() === "") {
      setError("Username is required");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password.length > 16) {
      setError("Password cannot be more than 16 characters long.");
      return;
    }

    // Validate password contains at least one uppercase letter
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    // Validate password contains at least one lowercase letter
    if (!/[a-z]/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    // Validate password contains at least one number
    if (!/\d/.test(formData.password)) {
      setError("Password must contain at least one number.");
      return;
    }

    // Validate password contains at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.upgradeToRegistered(formData);
      updateUser(response.data.user);
      setSuccess("Successfully upgraded to Standard user! Please check your email to verify your account.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Upgrade failed");
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
            <h2>Step 1: Upgrade to Standard Account</h2>
            <p className="upgrade-description">
              As a guest, you have limited access. Upgrade to standard account first.
            </p>

            {!showPasswordForm ? (
              <button
                className="btn btn-primary"
                onClick={() => setShowPasswordForm(true)}
              >
                Upgrade to Standard
              </button>
            ) : (
              <form onSubmit={handleGuestToRegistered} noValidate className="upgrade-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label>Last Name <span className="required-asterisk">*</span></label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last Name (no spaces)"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>First Name <span className="required-asterisk">*</span></label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First Name (no spaces)"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nickname <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Nickname (required, unique)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address <span className="required-asterisk">*</span></label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Username <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username (required, unique)"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password <span className="required-asterisk">*</span></label>
                  <input
                    type="password"
                    className="input-field"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password (8-16 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
                    required
                    minLength="8"
                    maxLength="16"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password <span className="required-asterisk">*</span></label>
                  <input
                    type="password"
                    className="input-field"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    placeholder="Confirm Password"
                    required
                    minLength="8"
                    maxLength="16"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Upgrading...' : 'Upgrade to Standard'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setFormData({
                      last_name: user?.last_name || "",
                      first_name: user?.first_name || "",
                      nickname: user?.nickname || "",
                      email: user?.email || "",
                      username: user?.username || "",
                      password: "",
                      password_confirmation: "",
                    });
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {!isGuest && (
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
      )}
    </div>
  );
}

export default Upgrade;
