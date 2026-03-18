import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { billAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './BillDetail.css';

function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isGuest, remainingAccessHours, canAccessBills, refreshUser } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [accessLimitReached, setAccessLimitReached] = useState(false);

  const loadBill = async () => {
    try {
      const response = await billAPI.getById(id);
      setBill(response.data.bill);

      // Track guest access time
      if (isGuest) {
        trackGuestAccess();
        // Refresh user data to get updated access hours
        await refreshUser();
      }
    } catch (err) {
      // Handle guest access limit error
      if (err.response?.status === 403 && err.response?.data?.access_limit_reached) {
        setAccessLimitReached(true);
        setError('');
      } else {
        setError("Failed to load bill details");
      }
    } finally {
      setLoading(false);
    }
  };

  // Track guest access time
  const trackGuestAccess = () => {
    const lastAccessTime = sessionStorage.getItem('guestLastAccessTime');
    const now = Date.now();
    
    if (!lastAccessTime) {
      sessionStorage.setItem('guestLastAccessTime', now.toString());
    } else {
      const elapsedHours = (now - parseInt(lastAccessTime)) / (1000 * 60 * 60);
      
      // Check if 24 hours have passed, reset the timer
      if (elapsedHours >= 24) {
        sessionStorage.setItem('guestLastAccessTime', now.toString());
      }
    }
  };

  const handleDelete = async () => {
    // Confirm before deleting
    const confirmed = window.confirm(
      `Are you sure you want to delete "${bill.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await billAPI.delete(id);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete bill. Please try again.");
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      const response = await billAPI.update(id, updatedData);
      setBill(response.data.bill);
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update bill. Please try again.");
    }
  };

  const handleArchive = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to ${bill.status === 'completed' ? 'mark as active' : 'mark as Done/Paid'} "${bill.title}"?`
    );

    if (!confirmed) return;

    try {
      const newStatus = bill.status === 'completed' ? 'active' : 'completed';
      const response = await billAPI.update(id, { status: newStatus });
      setBill(response.data.bill);
      if (newStatus === 'completed') {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update bill. Please try again.");
    }
  };

  useEffect(() => {
    loadBill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Guest access limit reached
  if (isGuest && accessLimitReached) {
    return (
      <div className="bill-detail">
        <div className="bill-detail-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
        <div className="bill-detail-content">
          <div className="guest-limit-warning">
            <p>⏰ Daily Access Limit Reached</p>
          </div>
          <div className="bill-info-card guest-view">
            <h2 style={{ marginBottom: '1rem', color: 'var(--slate-800)' }}>
              You've used your 6 hours of guest access for today
            </h2>
            <p style={{ color: 'var(--slate-600)', marginBottom: '1.5rem' }}>
              Come back tomorrow or upgrade to a registered account for unlimited access.
            </p>
            <div className="guest-upgrade-prompt">
              <h3>Upgrade to Registered Account</h3>
              <p>Get unlimited access to all features by setting a password</p>
              <Link to="/upgrade">
                <button className="btn btn-primary">Upgrade Now</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="bill-detail">
        <div className="error-state">
          <p>{error || 'Bill not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if user is the creator
  const isCreator = user && bill.created_by === user.id;

  return (
    <div className="bill-detail">
      <div className="bill-detail-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="bill-detail-content">
        {error && <div className="error-message">{error}</div>}
        
        {/* Guest Access Notice */}
        {isGuest && (
          <>
            <div className="guest-access-notice">
              <p>
                ⚠️ You are viewing this bill as a <strong>Guest User</strong>. 
                <span className="time-remaining-badge">
                  {remainingAccessHours === Infinity ? 'Unlimited' : `${remainingAccessHours}h`} remaining today
                </span>
              </p>
            </div>
            <div className="view-only-notice">
              👁 View-only access - Upgrade to edit bills
            </div>
          </>
        )}

        <div className={`bill-info-card ${isGuest ? 'guest-view' : ''}`}>
          <div className="bill-title-section">
            <h1>{bill.title}</h1>
            <span className={`status ${bill.status}`}>{bill.status}</span>
          </div>
          <div className="bill-total">₱{parseFloat(bill.total_amount).toFixed(2)}</div>
          {bill.description && <p className="bill-description">{bill.description}</p>}
          {bill.due_date && (
            <p className="bill-due">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
          )}
          <p className="bill-code">
            Invitation Code: <code>{bill.invitation_code}</code>
          </p>

          {/* Edit/Delete/Done buttons - Only for creator */}
          {isCreator && !isGuest ? (
            <div className="action-btn-container">
              <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
                Edit Bill
              </button>
              <button className="btn btn-archive" onClick={handleArchive}>
                {bill.status === 'completed' ? 'Mark as Active' : 'Done/Paid'}
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Bill
              </button>
            </div>
          ) : isGuest ? (
            <div className="guest-upgrade-prompt">
              <h3>Want to edit this bill?</h3>
              <p>Upgrade to a registered account to create and edit bills</p>
              <Link to="/upgrade">
                <button className="btn btn-primary">Upgrade to Registered</button>
              </Link>
            </div>
          ) : null}
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
                    {userItem.user_type === 'guest' && (
                      <span className="guest-badge">Guest</span>
                    )}
                  </div>
                  <div className="user-share">
                    ₱{parseFloat(userItem.pivot?.share_amount || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-users">No users yet</p>
          )}
        </div>

        {/* Guest Upgrade Prompt at bottom */}
        {isGuest && (
          <div className="guest-upgrade-prompt">
            <h3>Upgrade to Registered Account</h3>
            <p>
              Guest access is limited to 6 hours per day. Upgrade to a registered account for:
            </p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '1rem auto', color: 'var(--slate-700)' }}>
              <li>✓ Unlimited access to bills</li>
              <li>✓ Create up to 5 bills per month</li>
              <li>✓ Invite people to your bills</li>
              <li>✓ Edit and manage bills</li>
            </ul>
            <Link to="/upgrade">
              <button className="btn btn-primary">Upgrade Now</button>
            </Link>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditBillModal
          bill={bill}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

function EditBillModal({ bill, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: bill.title,
    total_amount: bill.total_amount,
    description: bill.description || '',
    due_date: bill.due_date ? bill.due_date.split('T')[0] : '',
    status: bill.status,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onUpdate(formData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Bill: {bill.title}</h2>
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
              placeholder="Enter bill title"
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
              placeholder="Enter total amount"
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
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BillDetail;
