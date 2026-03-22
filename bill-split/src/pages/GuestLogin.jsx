import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./GuestLogin.css";

function GuestLogin() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await guestLogin(email);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Guest login failed. Please try again.";
      const emailError = err.response?.data?.errors?.email?.[0];
      
      // Show specific error message
      setError(emailError || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-login-page">
      <div className="guest-login-container">
        <div className="guest-login-card">
          <div className="login-header">
            <h1>Login as Guest</h1>
            <p>
              Enter your email to access your guest account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Email Address <span className="required-asterisk">*</span></label>
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
                Use the same email you registered with
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login as Guest"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/guest/registration">Access bill via invitation code</Link>
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

export default GuestLogin;
