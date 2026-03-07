import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
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
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <h1>Create Account</h1>
          <p className="subtitle">Join Bill Split and simplify your bill management</p>

          {error && <div className="error-message">{error}</div>}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                className="input-field"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                className="input-field"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
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
              type="password"
              name="password"
              placeholder="Password"
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
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="divider">or</p>

          <Link to="/guest-register" className="guest-link">
            Continue as Guest (Limited Access)
          </Link>

          <p className="login-text">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>

        <div className="register-right">
          <div className="illustration">
            <img src="/images/Illustration.jpg" alt="Bill Split Illustration" className="illustration-img" />
            <h3>Make your work easier and organized with Bill Split</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
