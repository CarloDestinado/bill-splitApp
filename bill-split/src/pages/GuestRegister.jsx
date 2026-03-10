import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invitationAPI } from '../services/api';
import './GuestRegister.css';

function GuestRegister() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const navigate = useNavigate();
  const { guestRegister } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: prefillEmail,
  });
  const [invitation, setInvitation] = useState(null);
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    verifyInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const verifyInvitation = async () => {
    try {
      const response = await invitationAPI.verifyCode({ invitation_code: code.toUpperCase() });
      if (response.data.valid) {
        setInvitation(response.data.invitation);
        setBill(response.data.bill);
      } else {
        setError('Invalid or expired invitation code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invitation code');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register as guest
      await guestRegister(formData);

      // Accept the invitation
      if (invitation) {
        await invitationAPI.accept(invitation.id);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return <div className="guest-register-page"><div className="loading">Verifying invitation...</div></div>;
  }

  if (error && !invitation) {
    return (
      <div className="guest-register-page">
        <div className="error-container">
          <h1>Invalid Invitation</h1>
          <p className="error-message">{error}</p>
          <Link to="/guest/search" className="btn btn-primary">Search Another Bill</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-register-page">
      <div className="guest-register-container">
        <div className="guest-register-card">
          <div className="register-header">
            <h1>Create Guest Account</h1>
            <p>Fill in your details to access this bill</p>
          </div>

          <div className="bill-info-preview">
            <h3>{bill?.title}</h3>
            <div className="bill-amount">₱{parseFloat(bill?.total_amount || 0).toFixed(2)}</div>
          </div>

          <form onSubmit={handleRegister}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled
              />
              <p className="field-help">This email was invited to the bill</p>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Guest Account & Join Bill'}
            </button>
          </form>

          <div className="register-footer">
            <p className="guest-notice">
              ⚠️ Guest access is limited to 6 hours per day.
            </p>
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestRegister;
