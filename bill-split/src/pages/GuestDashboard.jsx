import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { billAPI } from "../services/api";
import "./GuestDashboard.css";

function GuestDashboard() {
  const {
    user,
    logout,
    isGuest,
    remainingAccessHours,
    canAccessBills,
  } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

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
              <Link to="/register">
                <button className="register-btn">Register now</button>
              </Link>
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
            <Link to="/register" className="btn btn-primary">
              Register Now
            </Link>
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

  return (
    <div className="guest-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Bill Split</h1>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <Link to="/register">
              <button className="register-btn">Register now</button>
            </Link>
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
                <Link to="/register"> Register now</Link> for unlimited access.
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
    </div>
  );
}

export default GuestDashboard;
