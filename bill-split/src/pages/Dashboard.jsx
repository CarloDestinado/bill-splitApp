import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { billAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { user, logout, isGuest, isPremium, isStandard, canCreateBill, canAccessBills, remainingAccessHours, remainingBillsThisMonth } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    loadBills();
  }, []);

  // Check guest access limit (but premium users always have access)
  if (isGuest && !isPremium && !canAccessBills) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="logo">Bill Split</h1>
            <div className="user-menu">
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="access-limit-notice">
            <h1>⏰ Daily Access Limit Reached</h1>
            <p>You've used your 6 hours of guest access for today.</p>
            <p>Please come back tomorrow or upgrade to a registered account for unlimited access.</p>
            <Link to="/upgrade" className="btn btn-primary">Upgrade to Registered</Link>
          </div>
        </main>
      </div>
    );
  }

  const loadBills = async () => {
    try {
      const response = await billAPI.getAll();
      setBills(response.data.bills);
    } catch (error) {
      console.error('Failed to load bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAccountBadge = () => {
    if (isPremium) {
      return <span className="badge premium">Premium</span>;
    }
    if (isGuest) {
      return <span className="badge guest">Guest</span>;
    }
    return <span className="badge standard">Standard</span>;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Bill Split</h1>
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">
                {user?.first_name} {user?.last_name}
              </span>
              {getAccountBadge()}
            </div>
            <nav className="user-nav">
              {!isGuest && (
                <>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <Link to="/upgrade" className="nav-link upgrade-link">Upgrade</Link>
                </>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-header-section">
            <h2>My Bills</h2>
            <div className="header-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                disabled={!canCreateBill}
              >
                + Create Bill
              </button>
              {!canCreateBill && isStandard && (
                <span className="limit-message">
                  Monthly bill limit reached (5/5). <Link to="/upgrade">Upgrade to Premium</Link> for unlimited bills.
                </span>
              )}
              {!canCreateBill && isGuest && (
                <span className="limit-message">
                  Guest users cannot create bills. <Link to="/upgrade">Upgrade to Registered</Link> to create bills.
                </span>
              )}
            </div>
          </div>

          {isGuest && !isPremium && (
            <div className="guest-notice">
              <p>⚠️ Guest users have limited access ({remainingAccessHours} hours remaining today).
                <Link to="/upgrade"> Upgrade to Registered</Link> for full access.
              </p>
            </div>
          )}

          {isStandard && (
            <div className="bill-limit-notice">
              <p>📊 Standard Plan: <strong>{remainingBillsThisMonth}</strong> bills remaining this month (5 max).
                <Link to="/upgrade"> Upgrade to Premium</Link> for unlimited bills.
              </p>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading bills...</div>
          ) : bills.length === 0 ? (
            <div className="empty-state">
              <p>No bills yet. Create your first bill to get started!</p>
            </div>
          ) : (
            <div className="bills-grid">
              {bills.map((bill) => (
                <div key={bill.id} className="bill-card">
                  <div className="bill-header">
                    <h3>{bill.title}</h3>
                    <span className={`status ${bill.status}`}>{bill.status}</span>
                  </div>
                  <div className="bill-amount">₱{parseFloat(bill.total_amount).toFixed(2)}</div>
                  <p className="bill-description">{bill.description || 'No description'}</p>
                  <div className="bill-footer">
                    <span className="bill-code">Code: {bill.invitation_code}</span>
                    <div className="bill-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowInviteModal(true);
                        }}
                      >
                        Invite
                      </button>
                      <Link to={`/bills/${bill.id}`} className="btn btn-sm btn-primary">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateBillModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            loadBills();
            setShowCreateModal(false);
          }}
        />
      )}

      {showInviteModal && selectedBill && (
        <InviteModal
          bill={selectedBill}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedBill(null);
          }}
        />
      )}
    </div>
  );
}

function CreateBillModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    total_amount: '',
    description: '',
    due_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await billAPI.create(formData);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create New Bill</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Bill Title</label>
            <input
              type="text"
              className="input-field"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Total Amount</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Due Date (optional)</label>
            <input
              type="date"
              className="input-field"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ bill, onClose }) {
  const { isPremium } = useAuth();
  const invitationCode = bill.invitation_code;
  const currentPersonCount = bill.users?.length || 0;
  const maxPersons = isPremium ? 'unlimited' : 3;
  const canAddMore = isPremium || currentPersonCount < 3;

  const copyCode = () => {
    navigator.clipboard.writeText(invitationCode);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Invite to Bill: {bill.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="invite-content">
          <div className="invite-section">
            <h3>Invitation Code</h3>
            <div className="code-display">
              <code>{invitationCode}</code>
              <button className="btn btn-sm" onClick={copyCode}>Copy</button>
            </div>
            <p className="code-help">Share this code with others to join the bill</p>
          </div>

          <div className="invite-section">
            <h3>Current Members</h3>
            <p className="members-count">
              <strong>{currentPersonCount}</strong> person{currentPersonCount !== 1 ? 's' : ''} joined
              {!isPremium && <span> / {maxPersons} max</span>}
            </p>
            {!canAddMore && (
              <p className="limit-warning">
                ⚠️ Standard plan limit reached. <Link to="/upgrade">Upgrade to Premium</Link> for unlimited members.
              </p>
            )}
          </div>

          <div className="invite-section">
            <h3>How to Invite</h3>
            <ol className="invite-steps">
              <li>Copy the invitation code above</li>
              <li>Share it with people you want to split the bill with</li>
              <li>They can enter the code on the <Link to="/guest/search">Guest Bill Search</Link> page</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
