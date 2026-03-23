import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { invitationAPI, billAPI } from "../services/api";
import "./CodeInvite.css";

function CodeInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });
  const [invitationCode, setInvitationCode] = useState("");
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setInvitationCode(codeFromUrl);
      verifyCode(codeFromUrl);
    }
  }, [searchParams]);

  const verifyCode = async (code) => {
    setError("");
    setLoading(true);

    try {
      console.log("Verifying invitation code:", code);
      const response = await invitationAPI.verifyCode({
        invitation_code: code.toUpperCase(),
      });
      console.log("Verification response:", response.data);
      
      if (response.data.valid) {
        setBill(response.data.bill);
        setStep(2);
      } else {
        setError(response.data.message || "Invalid invitation code");
      }
    } catch (err) {
      console.error("Code verification error:", err);
      setError(err.response?.data?.message || "Invalid invitation code");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Login the user
      await login(loginFormData.email, loginFormData.password);
      
      // Join the bill with the invitation code
      const response = await billAPI.joinWithCode({
        invitation_code: invitationCode.toUpperCase(),
      });
      
      // Navigate to the bill page
      navigate(`/bills/${response.data.bill.id}`);
    } catch (err) {
      console.error("Login/join error:", err);
      setError(
        err.response?.data?.message || "Failed to join bill. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-invite-page">
      <div className="code-invite-container">
        <div className="code-invite-card">
          <div className="login-header">
            <h1>Access Bill via Invitation Code</h1>
            <p>
              Enter the invitation code and your details to view the shared bill
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
                  Already have an account? <Link to="/login">Login here</Link>
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
                <h3>Login to Join This Bill</h3>
                <p className="prompt-description">
                  Please login with your account to access this bill
                </p>

                <form onSubmit={handleLogin} className="login-form" noValidate>
                  {error && <div className="error-message">{error}</div>}

                  <div className="form-group">
                    <label>Email Address <span className="required-asterisk">*</span></label>
                    <input
                      type="email"
                      name="email"
                      className="input-field"
                      placeholder="Enter your email"
                      value={loginFormData.email}
                      onChange={handleLoginInputChange}
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
                      placeholder="Enter your password"
                      value={loginFormData.password}
                      onChange={handleLoginInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login & Join Bill"}
                  </button>
                </form>

                <div className="login-options">
                  <div className="divider">or</div>
                  
                  <p className="guest-prompt">
                    Don't have an account? Create a guest account to view this bill
                  </p>
                  <Link to="/guest/registration" className="btn btn-secondary btn-full">
                    Continue as Guest
                  </Link>
                </div>

                <div className="login-footer">
                  <p>
                    Already have an account? <Link to="/login">Login here</Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="code-invite-info-panel">
          <h2>How It Works</h2>
          <ol className="info-steps">
            <li>
              <strong>Get Invitation Code</strong>
              <p>
                Ask the person who created the bill for your unique invitation
                code
              </p>
            </li>
            <li>
              <strong>Enter Your Details</strong>
              <p>
                Provide your name, email, and nickname to create a guest account
              </p>
            </li>
            <li>
              <strong>View Your Bill</strong>
              <p>Access the shared bill and see your portion immediately</p>
            </li>
          </ol>

          <div className="info-box">
            <h3>Guest Access Limits</h3>
            <ul>
              <li>6 hours of access per day</li>
              <li>View-only access to bills</li>
              <li>Cannot create new bills</li>
              <li>Cannot edit bill details</li>
            </ul>
            <p className="upgrade-hint">
              <strong>Tip:</strong> You can upgrade to a standard account
              anytime for unlimited access!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeInvite;
