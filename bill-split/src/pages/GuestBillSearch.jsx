import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { invitationAPI } from '../services/api';
import './GuestBillSearch.css';

function GuestBillSearch() {
  const [code, setCode] = useState('');
  const [verifiedBill, setVerifiedBill] = useState(null);
  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifiedBill(null);
    setEmailChecked(false);
    setLoading(true);

    try {
      const response = await invitationAPI.verifyCode({ invitation_code: code.toUpperCase() });
      if (response.data.valid) {
        setVerifiedBill(response.data.bill);
      } else {
        setError(response.data.message || 'Invalid invitation code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invitation code');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setCheckingEmail(true);

    try {
      const response = await invitationAPI.checkEmail({
        email,
        invitation_code: code.toUpperCase()
      });
      setEmailExists(response.data.exists);
      setEmailChecked(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check email');
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleContinue = () => {
    if (emailExists) {
      // User has account - redirect to login
      navigate('/login', { state: { email, inviteCode: code.toUpperCase() } });
    } else {
      // New user - redirect to registration with invitation (works with both bill codes and invitation codes)
      navigate(`/guest/register/${code.toUpperCase()}?email=${encodeURIComponent(email)}`);
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
          {!verifiedBill ? (
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
          ) : (
            <div className="bill-found">
              <div className="success-icon">✓</div>
              <h2>Bill Found!</h2>
              <div className="bill-details">
                <h3>{verifiedBill.title}</h3>
                <div className="bill-amount">₱{parseFloat(verifiedBill.total_amount).toFixed(2)}</div>
                {verifiedBill.description && (
                  <p className="bill-description">{verifiedBill.description}</p>
                )}
              </div>

              {!emailChecked ? (
                <form onSubmit={handleCheckEmail} className="email-check-form">
                  <h3>Check Your Email</h3>
                  <p className="form-help">Enter the email address you were invited with</p>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={checkingEmail}>
                    {checkingEmail ? 'Checking...' : 'Continue'}
                  </button>
                </form>
              ) : (
                <div className="email-result">
                  <h3>{emailExists ? 'Account Found!' : 'New User'}</h3>
                  <p className="result-message">
                    {emailExists
                      ? 'You have an existing account. Login to access this bill.'
                      : 'No account found. Create a guest account to access this bill.'}
                  </p>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleContinue}
                  >
                    {emailExists ? 'Go to Login' : 'Create Guest Account'}
                  </button>
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => setEmailChecked(false)}
                  >
                    Use Different Email
                  </button>
                </div>
              )}

              <p className="access-info">
                <strong>Guest Access:</strong> Limited to 6 hours per day.
                Upgrade to Registered for unlimited access.
              </p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="search-info">
          <h3>How to access your bill</h3>
          <ol>
            <li><strong>Get the code:</strong> Ask the bill creator for your invitation code</li>
            <li><strong>Enter the code:</strong> Type or paste the code above</li>
            <li><strong>Check your email:</strong> Enter the email you were invited with</li>
            <li><strong>Access the bill:</strong> Login or create guest account</li>
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
