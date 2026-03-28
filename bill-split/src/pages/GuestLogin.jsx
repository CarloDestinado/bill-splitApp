import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import "./GuestLogin.css";

function GuestLogin() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { guestLogin } = useAuth();
  const navigate = useNavigate();

  const validateUsername = (value) => {
    if (!value || value.trim() === "") {
      return "The username field is required.";
    }
    // Optionally add more validation here (e.g., min/max length, allowed chars)
    return "";
  };

  const checkUsernameExists = async (username) => {
    try {
      const response = await userAPI.checkUsername({ username });
      if (!response.data.exists) {
        return "Username does not exist";
      }
      return "";
    } catch (err) {
      return err.response?.data?.message || "Failed to verify username";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);

    try {
      // Check if username exists in database
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        setLoading(false);
        setError(usernameExists);
        return;
      }

      await guestLogin({ username });
      navigate("/dashboard");
    } catch (err) {
      // Laravel returns validation errors in err.response.data.errors
      const errorMessage = err.response?.data?.message || "Guest login failed. Please try again.";
      let usernameError = errorMessage;
      if (err.response?.data?.errors?.username) {
        // Laravel validation error for username field
        usernameError = err.response.data.errors.username[0];
      }
      setError(usernameError);
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
              Enter your username to access your guest account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Username <span className="required-asterisk">*</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
              <p className="field-help">
                Username must exist in the system
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
