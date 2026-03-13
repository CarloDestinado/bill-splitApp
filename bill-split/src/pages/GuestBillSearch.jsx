import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invitationAPI } from '../services/api';
import './GuestBillSearch.css';

function GuestBillSearch() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await invitationAPI.verifyCode({ invitation_code: code.toUpperCase() });
      if (response.data.valid) {
        sessionStorage.setItem('guestBillData', JSON.stringify(response.data.bill));
        navigate(`/guest/register/${code.toUpperCase()}`);
      } else {
        setError(response.data.message || 'Invalid invitation code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invitation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-bill-search">
      <div className="search-header">
        <Link to="/login" className="back-link">← Back to Login</Link>
        <h1>Access Your Bill</h1>
        <p className="subtitle">Enter the invitation code to view your shared bill</p>
      </div>

      <div className="search-container">
        <div className="search-card">
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Invitation Code</label>
              <input
                type="text"
                className="input-field code-input"
                placeholder="Enter code (e.g., ABC123)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Find My Bill'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="search-info">
          <h3>How to access your bill</h3>
          <ol>
            <li><strong>Get the code:</strong> Ask the bill creator for your invitation code</li>
            <li><strong>Enter the code:</strong> Type or paste the code above</li>
            <li><strong>Register as Guest:</strong> Enter your name and email</li>
            <li><strong>View the bill:</strong> Access your shared bill instantly</li>
          </ol>

          <div className="info-box">
            <h4>⚠️ Guest Access Limits</h4>
            <ul>
              <li>6 hours access per day</li>
              <li>View-only access to bills</li>
              <li>Cannot create new bills</li>
              <li>Upgrade anytime for full access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestBillSearch;
