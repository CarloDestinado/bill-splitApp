import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billAPI } from '../services/api';
import './BillDetail.css';

function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    try {
      const response = await billAPI.getById(id);
      setBill(response.data.bill);
    } catch (err) {
      setError('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
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

  return (
    <div className="bill-detail">
      <div className="bill-detail-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="bill-detail-content">
        <div className="bill-info-card">
          <div className="bill-title-section">
            <h1>{bill.title}</h1>
            <span className={`status ${bill.status}`}>{bill.status}</span>
          </div>
          <div className="bill-total">₱{parseFloat(bill.total_amount).toFixed(2)}</div>
          {bill.description && <p className="bill-description">{bill.description}</p>}
          {bill.due_date && (
            <p className="bill-due">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
          )}
          <p className="bill-code">Invitation Code: <code>{bill.invitation_code}</code></p>
        </div>

        <div className="users-card">
          <h2>People Sharing This Bill</h2>
          {bill.users && bill.users.length > 0 ? (
            <div className="users-list">
              {bill.users.map((user) => (
                <div key={user.id} className="user-item">
                  <div className="user-name">
                    {user.first_name} {user.last_name}
                    {user.id === bill.created_by && <span className="creator-badge">Creator</span>}
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
    </div>
  );
}

export default BillDetail;
