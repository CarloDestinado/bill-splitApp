import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    nickname: "",
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    if (formData.last_name.includes(" ")) {
      setError("Last name cannot contain spaces");
      return;
    }

    if (formData.first_name.includes(" ")) {
      setError("First name cannot contain spaces");
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      // Registration successful - redirect to login with success message
      navigate("/login", { 
        state: { 
          message: "Registration successful! Please check your email to verify your account before logging in.",
          email: formData.email
        } 
      });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <div className="illustration">
            <img
              src="/images/Illustration.jpg"
              alt="Bill Split Illustration"
              className="illustration-img"
            />
            <h3>Make your work easier and organized with Bill Split</h3>
          </div>
        </div>

        <div className="register-right">
          <h1>Create Account</h1>
          <p className="subtitle">
            Join Bill Split and simplify your bill management
          </p>

          {error && <div className="error-message">{error}</div>}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="last_name"
                placeholder="Last Name (no spaces)"
                className="input-field"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="first_name"
                placeholder="First Name (no spaces)"
                className="input-field"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <input
              type="text"
              name="nickname"
              placeholder="Nickname (required, unique)"
              className="input-field"
              value={formData.nickname}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Username (required, unique)"
              className="input-field"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (8-16 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password_confirmation"
              placeholder="Confirm Password"
              className="input-field"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
            />
            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <p className="divider">or</p>

          {/* <Link to="/guest-register" className="guest-link">
            Continue as Guest (Limited Access)
          </Link> */}

          <p className="login-text">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
