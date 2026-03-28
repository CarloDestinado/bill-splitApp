import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { invitationAPI, userAPI } from "../services/api";
import "./GuestRegistration.css";

function GuestRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { guestRegister } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    nickname: "",
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

  const validateUsername = (value) => {
    if (!value || value.trim() === "") {
      return "Username is required";
    }
    return "";
  };

  const checkUsernameExists = async (username) => {
    try {
      const response = await userAPI.checkUsername({ username });
      if (response.data.exists) {
        return "Username already exists";
      }
      return "";
    } catch (err) {
      return "";
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken
      const usernameTaken = await checkUsernameExists(formData.username);
      if (usernameTaken) {
        setLoading(false);
        setError(usernameTaken);
        return;
      }

      const guestData = {
        ...formData,
        invitation_code: invitationCode.toUpperCase(),
      };

      const result = await guestRegister(guestData);

      // guestRegister returns { user, token, bill } directly
      const billData = result.bill;

      console.log("Registration result:", result);
      console.log("Bill data:", billData);
      console.log("Bill from state:", bill);

      // Navigate to the bill page
      if (billData && billData.id) {
        navigate(`/bills/${billData.id}`);
      } else if (bill && bill.id) {
        // Fallback: use the bill from state (verified in step 1)
        navigate(`/bills/${bill.id}`);
      } else {
        console.error("No bill ID available for navigation");
        setError("Failed to navigate to bill. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errors = err.response?.data?.errors;
      if (errors) {
        // Filter out email errors
        const filteredErrors = Object.entries(errors).filter(
          ([key]) => !key.toLowerCase().includes('email')
        );
        if (filteredErrors.length > 0) {
          const firstError = Object.values(filteredErrors[0])[0];
          setError(Array.isArray(firstError) ? firstError[0] : firstError);
        }
      } else {
        const errorMsg = err.response?.data?.message || "Registration failed. Please try again.";
        // Filter out email errors too
        if (!errorMsg.toLowerCase().includes('email')) {
          setError(errorMsg);
        }
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
    <div className="guest-registration-page">
      <div className="guest-registration-container">
        <div className="guest-registration-card">
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

              <form onSubmit={handleRegister} noValidate>
                {error && <div className="error-message">{error}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name <span className="required-asterisk">*</span></label>
                    <input
                      type="text"
                      name="first_name"
                      className="input-field"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name <span className="required-asterisk">*</span></label>
                    <input
                      type="text"
                      name="last_name"
                      className="input-field"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Username <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    name="username"
                    className="input-field"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Nickname <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    name="nickname"
                    className="input-field"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder="How you want to be called"
                  />
                  <p className="field-help">
                    This will be displayed on the bill
                  </p>
                </div>

                <div className="form-group">
                  <label>Invitation Code</label>
                  <input
                    type="text"
                    className="input-field"
                    value={invitationCode}
                    disabled
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
                    {loading
                      ? "Creating Account..."
                      : "Create Account & View Bill"}
                  </button>
                </div>
              </form>

              <div className="login-footer">
                <p>
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="guest-registration-info-panel">
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

export default GuestRegistration;
