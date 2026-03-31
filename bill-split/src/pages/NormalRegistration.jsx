import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { invitationAPI, billAPI } from "../services/api";
import "./NormalRegistration.css";

function NormalRegistration() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [invitationCode, setInvitationCode] = useState("");
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if coming from another page with pre-filled data
    if (location.state?.invitationCode) {
      setInvitationCode(location.state.invitationCode);
      setBill(location.state.bill);
      setStep(2); // Skip to login form
    }
  }, [location.state]);

  const verifyCode = async (code) => {
    setError("");
    setLoading(true);

    try {
      const response = await invitationAPI.verifyCode({
        invitation_code: code.toUpperCase(),
      });

      if (response.data.valid) {
        setBill(response.data.bill);
        setStep(2);
      } else {
        setError(response.data.message || "Invalid invitation code");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid invitation code");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email || formData.email.trim() === "") {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password || formData.password.trim() === "") {
      errors.password = "Password is required";
    }

    return errors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);

    try {
      // Login with registered account
      await login(formData.email, formData.password);

      // After login, join the bill
      if (bill && bill.id) {
        // Join the bill using the invitation code
        await billAPI.joinWithCode({ invitation_code: invitationCode.toUpperCase() });
        navigate(`/bills/${bill.id}`);
      } else {
        // No bill, just go to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      
      // Check if it's an unverified email error
      if (message.includes("verify your email")) {
        setError("Please verify your email address before logging in.");
      } else if (err.response?.status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="normal-registration-page">
      <div className="normal-registration-container">
        <button className="back-to-login-btn" onClick={() => navigate('/login')}>
          ← Back to Login
        </button>
        <div className="normal-registration-card">
          <div className="login-header">
            <h1>Join Bill with Registered Account</h1>
            <p>
              Login to your registered account to join this bill
            </p>
          </div>

          {step === 1 && (
            <div className="step-container">
              <div className="step-indicator">
                <span className="step active">1</span>
                <span className="step-line"></span>
                <span className="step">2</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyCode(invitationCode);
                }}
                noValidate
              >
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Invitation Code <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    className="input-field code-input"
                    placeholder="Enter invitation code (e.g., ABC123)"
                    value={invitationCode}
                    onChange={(e) =>
                      setInvitationCode(e.target.value.toUpperCase())
                    }
                    required
                    disabled={loading}
                  />
                  <p className="field-help">
                    Ask the bill creator for your invitation code
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              <div className="login-footer">
                <p>
                  Don't have an account? <Link to="/register">Register here</Link>
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  Or continue as guest: <Link to="/guest/registration">Guest Access</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && bill && (
            <div className="step-container">
              <div className="step-indicator">
                <span className="step completed">1</span>
                <span className="step-line completed"></span>
                <span className="step active">2</span>
              </div>

              <div className="bill-preview">
                <h3>Bill Found!</h3>
                <div className="bill-info">
                  <strong>{bill.title}</strong>
                  <span className="bill-amount">
                    ₱{parseFloat(bill.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="login-prompt">
                <h4>Login to Join This Bill</h4>
                <p>Enter your registered account credentials to join and access this bill</p>
              </div>

              <form onSubmit={handleLogin} noValidate>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Email <span className="required-asterisk">*</span></label>
                  <input
                    type="email"
                    name="email"
                    className="input-field"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Password <span className="required-asterisk">*</span></label>
                  <input
                    type="password"
                    name="password"
                    className="input-field"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setStep(1);
                      setBill(null);
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login & Join Bill"}
                  </button>
                </div>
              </form>

              <div className="login-footer">
                <p>
                  Don't have an account? <Link to="/register">Register here</Link>
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  Or continue as guest: <Link to="/guest/registration">Guest Access</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="normal-registration-info-panel">
          <h2>How It Works</h2>
          <ol className="info-steps">
            <li>
              <strong>Get Invitation Code</strong>
              <p>
                Ask the person who created the bill for your unique invitation code
              </p>
            </li>
            <li>
              <strong>Login to Your Account</strong>
              <p>
                Enter your registered email and password to access the bill
              </p>
            </li>
            <li>
              <strong>Join & View Bill</strong>
              <p>Automatically join the bill and see your portion immediately</p>
            </li>
          </ol>

          <div className="info-box registered-benefits">
            <h3>Registered Account Benefits</h3>
            <ul>
              <li>✓ Unlimited access to bills</li>
              <li>✓ Create up to 5 bills per month</li>
              <li>✓ Invite people to your bills</li>
              <li>✓ Edit and manage bills</li>
              <li>✓ No daily time limits</li>
            </ul>
            <p className="upgrade-hint">
              <strong>Need more?</strong> Upgrade to Premium for unlimited bills and members!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NormalRegistration;
