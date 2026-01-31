import React, { useState } from 'react';
import { AdminOnlyRoute } from '../../ProtectedRoute';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';

function ProfileContent() {
  const username = localStorage.getItem('username');
  const userType = localStorage.getItem('userType') || 'Unknown';

  // --- Create User State ---
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newType, setNewType] = useState('worker');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
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

      setSuccess(`User "${newUsername}" created as ${newType.toUpperCase()}!`);
      setNewUsername('');
      setNewPassword('');
      setNewType('worker');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6 mobile:p-3 pt-16 mobile:pt-14 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* === Admin Profile Info === */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mobile:p-4">
            <h2 className="text-2xl mobile:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              Admin Profile
            </h2>
            <div className="space-y-2 text-lg mobile:text-base">
              <p>
                <strong className='text-gray-900 dark:text-gray-100'>Username:</strong>{' '}
                <span className="font-mono text-blue-600 dark:text-blue-400">{username}</span>
              </p>
              <p>
                <strong className='text-gray-900 dark:text-gray-100'>Role:</strong>{' '}
                <span className="capitalize font-medium text-green-600 dark:text-green-400">
                  {userType}
                </span>
              </p>
            </div>
          </div>

          {/* === Create New User === */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mobile:p-4">
            <h3 className="text-xl mobile:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Create New User
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm mobile:text-xs">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-sm mobile:text-xs">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 mobile:py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 mobile:py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 mobile:py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="worker">Worker</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 mobile:py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin-only access
export default function Profile() {
  return <ProfileContent />;
}