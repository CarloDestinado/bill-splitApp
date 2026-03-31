import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import "./GuestLogin.css";

function GuestLogin() {
  const [invitationCode, setInvitationCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!invitationCode || invitationCode.trim() === "") {
      newErrors.invitationCode = "Invitation code is required";
    }

    if (!email || email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);

    try {
      console.log("=== GuestLogin Submit ===");
      console.log("Email:", email);
      console.log("Invitation Code:", invitationCode);
      
      // Call the unified guest login endpoint
      const response = await authAPI.loginGuest({ email, invitation_code: invitationCode });
      console.log("=== Backend Response ===");
      console.log("Response data:", response.data);
      const { action, message, user, token, bill } = response.data;

      // Handle different actions based on backend response
      if (action === 'login_success') {
        console.log("=== Login Success ===");
        console.log("Token:", token ? token.substring(0, 20) + "..." : "NO TOKEN");
        console.log("User:", user);
        console.log("Bill:", bill);
        
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log("Stored token in localStorage:", localStorage.getItem('token') ? "YES" : "NO");

        // Navigate to guest dashboard with specific bill ID
        if (bill && bill.id) {
          console.log("Navigating to: /guest/dashboard/" + bill.id);
          navigate(`/guest/dashboard/${bill.id}`);
        } else {
          console.log("No bill.id - fallback to search");
          navigate('/guest/search');
        }
      } else if (action === 'redirect_to_registration') {
        // Email doesn't exist - redirect to guest registration
        navigate("/guest/registration", {
          state: {
            invitationCode,
            email,
            bill
          }
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to join bill. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-login-page">
      <div className="guest-login-container">
        <div className="guest-login-card">
          <div className="login-header">
            <h1>Join Bill</h1>
            <p>
              Enter your invitation code and email to access the bill
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Invitation Code <span className="required-asterisk">*</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter invitation code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                autoComplete="off"
                maxLength={8}
              />
              <p className="field-help">
                Enter the 8-character code from your bill invitation
              </p>
            </div>

            <div className="form-group">
              <label>Email <span className="required-asterisk">*</span></label>
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <p className="field-help">
                Email used to join the bill
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Checking..." : "Join Bill"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestLogin;
