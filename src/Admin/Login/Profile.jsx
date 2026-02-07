import React, { useState, useEffect } from 'react';
import { AdminOnlyRoute } from '../../ProtectedRoute';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function ProfileContent() {
  const username = localStorage.getItem('username');
  const userType = localStorage.getItem('userType') || 'Unknown';

  // ── Create User State ──
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newType, setNewType] = useState('worker');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // ── Change Password State ──
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(username); // default to self
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Show/hide password toggles
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Fetch all users if admin
  useEffect(() => {
    if (userType === 'admin') {
      const fetchUsers = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/users`);
          if (!res.ok) throw new Error('Failed to fetch users');
          const data = await res.json();
          setAllUsers(data);
        } catch (err) {
          console.error('Error fetching users:', err);
        }
      };
      fetchUsers();
    }
  }, [userType]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);

    if (!newUsername.trim() || !newPassword.trim()) {
      setCreateError('Username and password are required');
      setCreateLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('Password must be at least 6 characters');
      setCreateLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          type: newType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setCreateSuccess(`User "${newUsername}" created as ${newType.toUpperCase()}!`);
      setNewUsername('');
      setNewPassword('');
      setNewType('worker');

      // Refresh user list if admin
      if (userType === 'admin') {
        const resUsers = await fetch(`${API_BASE_URL}/api/users`);
        if (resUsers.ok) {
          const updatedUsers = await resUsers.json();
          setAllUsers(updatedUsers);
        }
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');
    setChangeLoading(true);

    if (!selectedUser || !newPass || !confirmNewPass) {
      setChangeError('All fields are required');
      setChangeLoading(false);
      return;
    }

    if (newPass.length < 6) {
      setChangeError('New password must be at least 6 characters');
      setChangeLoading(false);
      return;
    }

    if (newPass !== confirmNewPass) {
      setChangeError('New passwords do not match');
      setChangeLoading(false);
      return;
    }

    try {
      const payload = {
        username: selectedUser,
        newPassword: newPass,
      };

      const res = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setChangeSuccess('Password changed successfully!');
      setNewPass('');
      setConfirmNewPass('');
      setTimeout(() => setShowChangePasswordModal(false), 1800);
    } catch (err) {
      setChangeError(err.message);
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6 mobile:p-4 pt-16 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Profile Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mobile:p-5">
            <h2 className="text-2xl mobile:text-xl font-bold mb-5 text-gray-900 dark:text-gray-100">
              Profile
            </h2>
            <div className="space-y-3 text-base mobile:text-sm">
              <p>
                <strong className="text-gray-900 dark:text-gray-200">Username:</strong>{' '}
                <span className="font-mono text-blue-600 dark:text-blue-400">{username}</span>
              </p>
              <p>
                <strong className="text-gray-900 dark:text-gray-200">Role:</strong>{' '}
                <span className="capitalize font-semibold text-green-600 dark:text-green-400">
                  {userType}
                </span>
              </p>
            </div>
          </div>

          {/* Create New User – Admin Only */}
          {userType === 'admin' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mobile:p-5">
              <h3 className="text-xl mobile:text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100">
                Create New User
              </h3>

              {createError && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                  {createSuccess}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="worker">Worker</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition shadow-sm"
                >
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>
          )}

          {/* Change Password Button */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => {
                setShowChangePasswordModal(true);
                setChangeError('');
                setChangeSuccess('');
                setNewPass('');
                setConfirmNewPass('');
                setSelectedUser(username);
                setShowNewPass(false);
                setShowConfirmPass(false);
              }}
              className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-7 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {changeError && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm border border-red-200 dark:border-red-800">
                {changeError}
              </div>
            )}
            {changeSuccess && (
              <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm border border-green-200 dark:border-green-800">
                {changeSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* User selection – only for admin */}
              {userType === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {allUsers.map(u => (
                      <option key={u.username} value={u.username}>
                        {u.username} ({u.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* New Password with eye icon */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-11"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-11 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showNewPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>

              {/* Confirm Password with eye icon */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-11"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-11 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changeLoading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
                >
                  {changeLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep AdminOnlyRoute protection
export default function Profile() {
  return <ProfileContent />;
}