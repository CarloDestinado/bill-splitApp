import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { billAPI, authAPI } from "../services/api";
import "./GuestDashboard.css";

function GuestDashboard() {
  const {
    user,
    logout,
    isGuest,
    remainingAccessHours,
    canAccessBills,
    updateUser,
  } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  // Auto-logout when access hours reach 0
  useEffect(() => {
    if (isGuest && remainingAccessHours <= 0) {
      logout();
      navigate("/login");
    }
  }, [isGuest, remainingAccessHours, logout, navigate]);

  // Check guest access limit
  if (isGuest && !canAccessBills) {
    return (
      <div className="guest-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="logo">Bill Split</h1>
            <div className="header-actions">
              <button onClick={logout} className="logout-btn">Logout</button>
              <button onClick={() => setShowRegisterModal(true)} className="register-btn">Register now</button>
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="access-limit-notice">
            <h1>⏰ Daily Access Limit Reached</h1>
            <p>You've used your 6 hours of guest access for today.</p>
            <p>
              Please come back tomorrow or register for a standard account for
              unlimited access.
            </p>
            <button onClick={() => setShowRegisterModal(true)} className="btn btn-primary">
              Register Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  const loadBills = async () => {
    try {
      const response = await billAPI.getAll();
      const activeBills = response.data.bills.filter(
        (bill) => bill.status !== "completed",
      );
      setBills(activeBills);
    } catch (error) {
      console.error("Failed to load bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRegisterNow = () => {
    setShowRegisterModal(true);
  };

  const handleUpgradeToRegistered = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (passwordData.password !== passwordData.password_confirmation) {
      setRegisterError("Passwords do not match");
      return;
    }

    if (passwordData.password.length < 8) {
      setRegisterError("Password must be at least 8 characters long.");
      return;
    }

    if (passwordData.password.length > 16) {
      setRegisterError("Password cannot be more than 16 characters long.");
      return;
    }

    if (!/[A-Z]/.test(passwordData.password)) {
      setRegisterError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(passwordData.password)) {
      setRegisterError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/\d/.test(passwordData.password)) {
      setRegisterError("Password must contain at least one number.");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.password)) {
      setRegisterError("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await authAPI.upgradeToRegistered(passwordData);
      updateUser(response.data.user);
      setShowRegisterModal(false);
      setPasswordData({ password: "", password_confirmation: "" });
      navigate("/dashboard");
    } catch (err) {
      setRegisterError(err.response?.data?.message || "Upgrade failed. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="guest-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Bill Split</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <button onClick={handleRegisterNow} className="register-btn">Register now</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-header-section">
            <h2>My Bills</h2>
          </div>

          {isGuest && (
            <div className="guest-notice">
              <p>
                ⚠️ Guest access: <strong>{Math.floor(remainingAccessHours)} hours</strong> remaining today.
                <button onClick={handleRegisterNow} className="inline-btn">Register now</button> for unlimited access.
              </p>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading bills...</div>
          ) : bills.length === 0 ? (
            <div className="empty-state">
              <p>No bills found.</p>
              <Link to="/guest/search" className="btn btn-primary">
                Join a Bill
              </Link>
            </div>
          ) : (
            <div className="bills-grid">
              {bills.map((bill) => (
                <div key={bill.id} className="bill-card">
                  <div className="bill-header">
                    <h3>{bill.title}</h3>
                    <span className={`status ${bill.status}`}>{bill.status}</span>
                  </div>
                  <div className="bill-amount">
                    ₱{parseFloat(bill.total_amount).toFixed(2)}
                  </div>
                  <p className="bill-description">
                    {bill.description || "No description"}
                  </p>
                  <div className="bill-footer">
                    <span className="bill-code">
                      Code: {bill.invitation_code}
                    </span>
                    <Link
                      to={`/bills/${bill.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      View Bill
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Register for Standard Account</h2>
              <button className="close-btn" onClick={() => {
                setShowRegisterModal(false);
                setPasswordData({ password: "", password_confirmation: "" });
                setRegisterError("");
              }}>×</button>
            </div>
            <form onSubmit={handleUpgradeToRegistered} noValidate>
              {registerError && <div className="error-message">{registerError}</div>}
              
              <div className="modal-content">
                <p className="modal-description">
                  Set a password to upgrade your guest account to a standard account with unlimited access.
                </p>

                <div className="form-group">
                  <label>Password <span className="required-asterisk">*</span></label>
                  <input
                    type="password"
                    className="input-field"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    placeholder="Password (8-16 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
                    required
                    disabled={registerLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password <span className="required-asterisk">*</span></label>
                  <input
                    type="password"
                    className="input-field"
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                    placeholder="Confirm Password"
                    required
                    disabled={registerLoading}
                  />
                </div>

                <ul className="password-requirements">
                  <li>At least 8 characters</li>
                  <li>At least 1 uppercase letter</li>
                  <li>At least 1 lowercase letter</li>
                  <li>At least 1 number</li>
                  <li>At least 1 special character</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setPasswordData({ password: "", password_confirmation: "" });
                    setRegisterError("");
                  }}
                  disabled={registerLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={registerLoading}
                >
                  {registerLoading ? "Upgrading..." : "Upgrade to Standard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestDashboard;
