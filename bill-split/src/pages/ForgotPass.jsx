import { useState } from "react";
// CHERRY-PICKS DATA ONLY WHILE IGNORING ALL OTHER THINGS LIKE ANIMATION

import { Link, useNavigate } from "react-router-dom";
// THIS ENABLES US TO USE Link TAGS, AS JSX DOES NOT HAVE BUILT-IN LINKING LIKE HTML

import { authAPI } from "../services/api";
// THIS IS STORAGE MANAGER WHO WILL CHECK FOR STUFF IN THE STORAGE LATER

import "./ForgotPass.css";

function ForgotPass() {
  const [nickname, setNickname] = useState("");
  // const [A, B] = useState(“”) C
  // A = what im typing or input box and the callable for validations, [Clay and validations is the way to form the clay]
  // B = the button to update the value, [the hand placing the clay back to canister]
  // C = this guy will write it down or memory [canister]

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  // SAME THING, BUT useState ONLY ACCEPTS YES OR NO ANSWERS

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Verify nickname/email exists and redirect to change password page
      const response = await authAPI.forgotPassword({ nickname, email });
      
      setSuccess("User verified! Redirecting...");

      // Redirect to ChangePass page with email and nickname
      setTimeout(() => {
        navigate("/change-password", {
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
            "Failed to verify user. Please check your details.",
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
