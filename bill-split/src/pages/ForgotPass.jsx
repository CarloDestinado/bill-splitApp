import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import "./ForgotPass.css";

function ForgotPass() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Call backend to verify nickname/email and get reset token
      const response = await authAPI.forgotPassword({ nickname, email });

      // Store token and redirect to change password page
      const resetToken = response.data.token;
      setSuccess("Success! Redirecting...");

      // Redirect to ChangePass page with token and email
      setTimeout(() => {
        navigate(`/change-password/${resetToken}`, {
          state: { email, nickname },
        });
      }, 1500);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to send reset token. Please check your details.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgotpass-page">
      <div className="forgotpass-container">
        <div className="forgotpass-left">
          <div className="illustration">
            <img
              src="/images/Illustration.jpg"
              alt="Bill Split Illustration"
              className="illustration-img"
            />
            <h3>Make your work easier and organized with Bill Split</h3>
          </div>
        </div>

        <div className="forgotpass-right">
          <h1>Forgot Password</h1>
          <p className="subtitle">
            Enter your nickname and email to reset your password
          </p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form className="forgotpass-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nickname"
              className="input-field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="forgotpass-btn" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
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

export default ForgotPass;
