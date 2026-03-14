import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import "./ChangePass.css";

function ChangePass() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email and nickname from previous page
  const { email, nickname } = location.state || {};
  
  // Redirect back if no data provided
  if (!email || !nickname) {
    navigate("/forgot-password");
    return null;
  }

  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
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
      setError(
        "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).",
      );
      return;
    }

    setLoading(true);

    try {
      // Call backend to reset password with nickname and email
      await authAPI.resetPassword({
        nickname,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      setSuccess("Success! Redirecting to login...");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to reset password. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="changepass-page">
      <div className="changepass-container">
        <div className="changepass-left">
          <div className="illustration">
            <img
              src="/images/Illustration.jpg"
              alt="Bill Split Illustration"
              className="illustration-img"
            />
            <h3>Make your work easier and organized with Bill Split</h3>
          </div>
        </div>

        <div className="changepass-right">
          <h1>Change Password</h1>
          <p className="subtitle">Enter your new password below</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form className="changepass-form" onSubmit={handleSubmit}>
            <input
              type="password"
              name="password"
              placeholder="New Password (min 8 characters)"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password_confirmation"
              placeholder="Confirm New Password"
              className="input-field"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
            />
            <button type="submit" className="changepass-btn" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <p className="divider">or</p>

          <p className="login-text">
            Remember your password? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChangePass;
