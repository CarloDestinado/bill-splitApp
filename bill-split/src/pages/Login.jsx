import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get success message from navigation state (after registration)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Pre-fill email if provided
      if (location.state?.email) {
        setEmail(location.state.email);
      }
      // Clear the state so message doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const validateForm = () => {
    const newErrors = {};

    if (!email || email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password || password.trim() === "") {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResendVerification = async () => {
    setError("");
    setLoading(true);
    try {
      await authAPI.resendVerification({ email });
      setSuccessMessage("Verification email sent! Please check your inbox.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend verification email.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";

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

  // Show resend verification link if error contains verify message
  const showResendVerification = error && error.includes("verify your email");

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="illustration">
            <img
              src="/images/Illustration.jpg"
              alt="Bill Split Illustration"
              className="illustration-img"
            />
            <h3>Make your work easier and organized with Bill Split</h3>
          </div>
        </div>

        <div className="login-right">
          <h1>Welcome back!</h1>
          <p className="subtitle">
            Simplify your workflow and boost your productivity with Bill Split
          </p>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label className="input-label">
                Email <span className="required-asterisk">*</span>
              </label>
              <input
                type="email"
                placeholder="Email"
                className={`input-field ${errors.email ? "input-error" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                required
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>
            <div className="input-group">
              <div className="password-field">
                <label className="input-label">
                  Password <span className="required-asterisk">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  className={`input-field ${errors.password ? "input-error" : ""}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  required
                />
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
            <div className="login-options">
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
              {showResendVerification && (
                <button
                  type="button"
                  className="resend-verification"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  Resend Verification Email
                </button>
              )}
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              className="guest-login-btn"
              onClick={() => navigate("/guest/login")}
              disabled={loading}
            >
              Rejoin as Guest
            </button>
          </form>

          <p className="divider">or continue with</p>

          <Link to="/guest/registration" className="access-code-btn">
            🔍 Access Bill via Invitation Code
          </Link>

          <div className="register-text">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
