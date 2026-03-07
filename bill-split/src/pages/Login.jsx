import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await guestLogin(email);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Guest login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <h1>Welcome back!</h1>
          <p className="subtitle">Simplify your workflow and boost your productivity with Bill Split</p>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="password-field">
              <input
                type="password"
                placeholder="Password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <a href="#" className="forgot-password">Forgot Password?</a>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="divider">or continue with</p>

          <Link to="/guest/search" className="access-code-btn">
            🔍 Access Bill via Invitation Code
          </Link>

          <div className="guest-login-section">
            <p className="guest-label">Continue as Guest</p>
            <form className="guest-form" onSubmit={handleGuestLogin}>
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="guest-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Continue as Guest'}
              </button>
            </form>
          </div>

          <p className="register-text">
            Not a member? <Link to="/register">Register now</Link>
          </p>
        </div>

        <div className="login-right">
          <div className="illustration">
            <img src="/images/Illustration.jpg" alt="Bill Split Illustration" className="illustration-img" />
            <h3>Make your work easier and organized with Bill Split</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
