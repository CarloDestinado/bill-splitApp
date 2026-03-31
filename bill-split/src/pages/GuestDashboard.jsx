import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { billAPI, authAPI } from "../services/api";
import "./GuestDashboard.css";

function GuestDashboard() {
  const { billId } = useParams();
  const {
    user,
    logout,
    isGuest,
    remainingAccessHours,
    canAccessBills,
    updateUser,
  } = useAuth();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    console.log("=== GuestDashboard Mounting ===");
    console.log("billId from URL:", billId);
    console.log("localStorage token:", localStorage.getItem("token"));
    console.log("localStorage user:", localStorage.getItem("user"));
    loadBill();
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
    console.log("=== Access Limit Reached ===");
    return (
      <div className="guest-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="logo">Bill Split</h1>
            <div className="header-actions">
              <button onClick={logout} className="logout-btn">
                Logout
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="register-btn"
              >
                Register now
              </button>
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
            <button
              onClick={() => setShowRegisterModal(true)}
              className="btn btn-primary"
            >
              Register Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  const loadBill = async () => {
    console.log("=== loadBill Called ===");
    console.log("billId:", billId);

    try {
      if (!billId) {
        console.log("No billId - showing error");
        setError("No bill specified. Please login with an invitation code.");
        return;
      }

      console.log("Calling billAPI.getById with billId:", billId);
      const token = localStorage.getItem("token");
      console.log(
        "Token being sent:",
        token ? token.substring(0, 20) + "..." : "NO TOKEN",
      );

      const response = await billAPI.getById(billId);
      console.log("API Response:", response.data);
      setBill(response.data.bill);
    } catch (error) {
      console.log("=== ERROR in loadBill ===");
      console.error("Error:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);

      // Check if it's the guest access limit error
      if (
        error.response?.status === 403 &&
        error.response?.data?.access_limit_reached
      ) {
        setError(
          "You have used your 6 hour limit, please wait 24 hours for the limit to reset or register for unlimited access.",
        );
      } else {
        setError(
          "Failed to load bill. Please check your invitation code and try again.",
        );
      }
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
      setRegisterError(
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).',
      );
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
      setRegisterError(
        err.response?.data?.message || "Upgrade failed. Please try again.",
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="guest-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="logo">Bill Split</h1>
            <div className="header-actions">
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
              <button onClick={handleRegisterNow} className="register-btn">
                Register now
              </button>
            </div>
          </div>
        </header>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!bill) {
    const isAccessLimitError = error && error.includes("6 hour limit");

    return (
      <div className="guest-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="logo">Bill Split</h1>
            <div className="header-actions">
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
              <button onClick={handleRegisterNow} className="register-btn">
                Register now
              </button>
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          <div className="error-state">
            {isAccessLimitError ? (
              <>
                <p className="access-limit-error">{error}</p>
                <div className="access-limit-actions">
                  <button
                    onClick={handleRegisterNow}
                    className="btn btn-primary"
                  >
                    Register for Unlimited Access
                  </button>
                  <Link to="/guest/login" className="btn btn-secondary">
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>{error || "No bill found."}</p>
                <Link to="/guest/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Bill Split</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
            <button onClick={handleRegisterNow} className="register-btn">
              Register now
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="bill-detail-stack">
          {isGuest && (
            <>
              <div className="guest-access-notice">
                <p>
                  ⚠️ You are viewing this bill as a <strong>Guest User</strong>.
                  <span className="time-remaining-badge">
                    {remainingAccessHours === Infinity
                      ? "Unlimited"
                      : `${Math.floor(remainingAccessHours)}h`}{" "}
                    remaining today
                  </span>
                </p>
              </div>
              <div className="view-only-notice">
                👁 View-only access - Register to edit bills
              </div>
            </>
          )}

          <div className={`joined-bill ${isGuest ? "guest-view" : ""}`}>
            <div className="bill-title-section">
              <h1>{bill.title}</h1>
              <span className={`status ${bill.status}`}>{bill.status}</span>
            </div>
            <div className="bill-total">
              ₱{parseFloat(bill.total_amount).toFixed(2)}
            </div>
            {bill.description && (
              <p className="bill-description">{bill.description}</p>
            )}
            {bill.due_date && (
              <p className="bill-due">
                Due: {new Date(bill.due_date).toLocaleDateString()}
              </p>
            )}
            <p className="bill-code">
              Invitation Code: <code>{bill.invitation_code}</code>
            </p>
          </div>

          <div className="users-card">
            <h2>People Sharing This Bill</h2>
            {bill.users && bill.users.length > 0 ? (
              <div className="users-list">
                {bill.users.map((userItem) => (
                  <div key={userItem.id} className="user-item">
                    <div className="user-name">
                      {userItem.first_name} {userItem.last_name}
                      {userItem.id === bill.created_by && (
                        <span className="creator-badge">Creator</span>
                      )}
                      {userItem.user_type === "guest" && (
                        <span className="guest-badge">Guest</span>
                      )}
                    </div>
                    <div className="user-share">
                      ₱
                      {parseFloat(userItem.pivot?.share_amount || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-users">No users yet</p>
            )}
          </div>

          {isGuest && (
            <div className="guest-upgrade-prompt">
              <h3>Register for a Standard Account</h3>
              <p>
                Guest access is limited to 6 hours per day. Register for a
                standard account for:
              </p>
              <ul
                style={{
                  textAlign: "left",
                  maxWidth: "400px",
                  margin: "1rem auto",
                  color: "var(--slate-700)",
                }}
              >
                <li>✓ Unlimited access to bills</li>
                <li>✓ Create up to 5 bills per month</li>
                <li>✓ Invite people to your bills</li>
                <li>✓ Edit and manage bills</li>
              </ul>
              <button className="btn btn-primary" onClick={handleRegisterNow}>
                Register Now
              </button>
            </div>
          )}
        </div>
      </div>

      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Register for Standard Account</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowRegisterModal(false);
                  setPasswordData({ password: "", password_confirmation: "" });
                  setRegisterError("");
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpgradeToRegistered} noValidate>
              {registerError && (
                <div className="error-message">{registerError}</div>
              )}

              <div className="modal-content">
                <p className="modal-description">
                  Set a password to upgrade your guest account to a standard
                  account with unlimited access.
                </p>

                <div className="form-group">
                  <label>
                    Password <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        password: e.target.value,
                      })
                    }
                    placeholder="Password (8-16 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
                    required
                    disabled={registerLoading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Confirm Password{" "}
                    <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={passwordData.password_confirmation}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        password_confirmation: e.target.value,
                      })
                    }
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
                    setPasswordData({
                      password: "",
                      password_confirmation: "",
                    });
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
