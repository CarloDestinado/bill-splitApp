import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { billAPI } from "../services/api";
import "./BillDetail.css";

function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    try {
      const response = await billAPI.getById(id);
      setBill(response.data.bill);
    } catch (err) {
      setError("Failed to load bill details");
    } finally {
      setLoading(false);
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
      alert("Bill deleted successfully!");
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to delete bill. Please try again.";
      alert(message);
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      const response = await billAPI.update(id, updatedData);
      setBill(response.data.bill);
      setShowEditModal(false);
      alert("Bill updated successfully!");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update bill. Please try again.";
      alert(message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || !bill) {
    return (
      <div className="bill-detail">
        <div className="error-state">
          <p>{error || "Bill not found"}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-detail">
      <div className="bill-detail-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="bill-detail-content">
        <div className="bill-info-card">
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

          <div className="action-btn-container">
            <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>Edit Bill</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Bill</button>
          </div>
        </div>

        <div className="users-card">
          <h2>People Sharing This Bill</h2>
          {bill.users && bill.users.length > 0 ? (
            <div className="users-list">
              {bill.users.map((user) => (
                <div key={user.id} className="user-item">
                  <div className="user-name">
                    {user.first_name} {user.last_name}
                    {user.id === bill.created_by && (
                      <span className="creator-badge">Creator</span>
                    )}
                  </div>
                  <div className="user-share">
                    ₱{parseFloat(user.pivot?.share_amount || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-users">No users yet</p>
          )}
        </div>
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

export default BillDetail;

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
          <div className="form-group">
            <label>Status</label>
            <select
              className="input-field"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
