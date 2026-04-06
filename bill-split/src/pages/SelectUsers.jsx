import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import './SelectUsers.css';

function SelectUsers() {
  const navigate = useNavigate();
  const { user, logout, isPremium } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [billData, setBillData] = useState(null);
  const [maxUsers, setMaxUsers] = useState(null);

  useEffect(() => {
    // Get bill data from navigation state
    const state = navigate.state;
    if (state?.billId) {
      setBillData({ id: state.billId, title: state.billTitle });
    }

    // Calculate max users based on account type
    if (isPremium) {
      setMaxUsers(Infinity); // Premium: unlimited
    } else {
      setMaxUsers(3); // Standard: max 3 users per bill
    }

    loadUsers();
  }, [isPremium]);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      // Filter out current user
      const otherUsers = response.data.users.filter(u => u.id !== user?.id);
      setAllUsers(otherUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId) => {
    // Check if we've reached the limit
    if (!selectedUsers.includes(userId) && maxUsers !== Infinity && selectedUsers.length >= maxUsers) {
      setError(`You can only invite up to ${maxUsers} users to this bill (Standard plan limit). Upgrade to Premium for unlimited invites.`);
      return;
    }

    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      setError(''); // Clear error when successfully selecting
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  // Helper: get full user object(s) for selected IDs
  const getSelectedUserObjects = () => {
    return allUsers.filter(u => selectedUsers.includes(u.id));
  };

  const handleInviteSingle = (userId) => {
    // Check limit
    if (maxUsers !== Infinity && selectedUsers.length >= maxUsers && !selectedUsers.includes(userId)) {
      setError(`You can only invite up to ${maxUsers} users to this bill (Standard plan limit).`);
      return;
    }

    // Find the single user object
    const singleUser = allUsers.find(u => u.id === userId);
    if (!singleUser) {
      setError('User not found.');
      return;
    }

    // Navigate back with single user email
    navigate('/dashboard', {
      state: {
        selectedUserEmails: [singleUser.email],
        action: 'invite_selected',
        billId: billData?.id
      }
    });
  };

  const handleInviteSelected = () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to invite');
      return;
    }

    // Check limit again before inviting
    if (maxUsers !== Infinity && selectedUsers.length > maxUsers) {
      setError(`You can only invite up to ${maxUsers} users to this bill (Standard plan limit).`);
      return;
    }

    // Get full user objects to extract emails
    const selectedUserObjects = getSelectedUserObjects();
    const userEmails = selectedUserObjects.map(u => u.email);

    // Navigate back with selected user emails
    navigate('/dashboard', {
      state: {
        selectedUserEmails: userEmails,
        action: 'invite_selected',
        billId: billData?.id
      }
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredUsers = allUsers.filter(u => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || username.includes(search) || email.includes(search);
  });

  return (
    <div className="select-users-page">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Bill Split</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              ← Back to Dashboard
            </button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="select-users-main">
        <div className="select-users-content">
          <div className="select-users-header">
            <h2>Select Users to Invite</h2>
            <p>Choose users from your contacts to invite to your bill</p>
          </div>

          <div className="select-users-toolbar">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="toolbar-actions">
              <button
                className="btn btn-secondary"
                onClick={handleSelectAll}
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="selected-count">
                {selectedUsers.length} {maxUsers !== Infinity ? `/ ${maxUsers}` : ''} selected
              </span>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="select-all-cell">
                      <button
                        className="btn-select-all"
                        onClick={handleSelectAll}
                      >
                        {selectedUsers.length === filteredUsers.length ? '✓ Deselect All' : 'Select All'}
                      </button>
                    </th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th className="invite-action-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`user-row ${selectedUsers.includes(u.id) ? 'selected' : ''}`}
                    >
                      <td className="select-cell" onClick={() => handleSelectUser(u.id)}>
                        <div className={`checkbox ${selectedUsers.includes(u.id) ? 'checked' : ''}`}>
                          {selectedUsers.includes(u.id) ? '✓' : ''}
                        </div>
                      </td>
                      <td className="name-cell" onClick={() => handleSelectUser(u.id)}>
                        <div className="user-avatar-small">
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <span className="user-fullname">{u.first_name} {u.last_name}</span>
                      </td>
                      <td className="username-cell" onClick={() => handleSelectUser(u.id)}>@{u.username}</td>
                      <td className="email-cell" onClick={() => handleSelectUser(u.id)}>{u.email}</td>
                      <td className="type-cell" onClick={() => handleSelectUser(u.id)}>
                        {u.user_type === 'guest' ? (
                          <span className="badge guest">Guest</span>
                        ) : (
                          <span className="badge registered">Registered</span>
                        )}
                      </td>
                      <td className="invite-action-cell">
                        <button
                          className="btn btn-sm btn-invite-single"
                          onClick={() => handleInviteSingle(u.id)}
                        >
                          Invite
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="select-users-footer">
            <button
              className="btn btn-primary btn-large"
              onClick={handleInviteSelected}
              disabled={selectedUsers.length === 0 || (maxUsers !== Infinity && selectedUsers.length >= maxUsers)}
            >
              {maxUsers !== Infinity && selectedUsers.length >= maxUsers 
                ? `Limit Reached (${maxUsers}/${maxUsers})` 
                : `Invite ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''} Selected Users`}
            </button>
            {maxUsers !== Infinity && (
              <p className="invite-limit-hint">
                Standard Plan: Max {maxUsers} users per bill. <Link to="/upgrade">Upgrade to Premium</Link> for unlimited invites.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SelectUsers;
