import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaEdit, FaTrash, FaSpinner, FaSearch } from 'react-icons/fa';

export default function ViewStock() {
  const [godowns, setGodowns] = useState([]);
  const [filteredGodowns, setFilteredGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const navigate = useNavigate();

  const userType = (localStorage.getItem('userType') || 'worker').toLowerCase();
  const isWorkerOrAgent = ['worker', 'agent'].includes(userType);
  const isAdmin = userType === 'admin';

  const styles = {
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  const capitalize = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchGodowns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/fast`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGodowns(data || []);
      setFilteredGodowns(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load godowns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodowns();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const query = searchQuery.toLowerCase().trim();
    const filtered = godowns.filter(g =>
      g.name?.toLowerCase().includes(query)
    );
    setFilteredGodowns(filtered);
    setCurrentPage(1);
  }, [searchQuery, godowns, isAdmin]);

  const totalPages = isAdmin ? Math.ceil(filteredGodowns.length / itemsPerPage) : 1;
  const paginatedGodowns = isAdmin
    ? filteredGodowns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredGodowns;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (id) => navigate(`/view-stocks/${id}`);

  const startEdit = (id, currentName) => {
    setEditingId(id);
    setEditName(capitalize(currentName));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id) => {
    const trimmed = editName.trim();
    if (!trimmed) return alert('Name is required');

    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');

      setGodowns(prev => prev.map(g =>
        g.id === id ? { ...g, name: data.name } : g
      ));
      cancelEdit();
    } catch (err) {
      alert(err.message);
    }
  };

  const openDeleteModal = (id) => {
    const godown = godowns.find(g => g.id === id);
    if (!godown) return;
    setDeleteModal({ open: true, id, name: capitalize(godown.name) });
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Delete failed');
      }
      setGodowns(prev => prev.filter(g => g.id !== id));
      setDeleteModal({ open: false, id: null, name: '' });
    } catch (err) {
      alert(err.message);
      setDeleteModal({ open: false, id: null, name: '' });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, id: null, name: '' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Loading Godowns...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16 overflow-auto">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-100 mb-4">
            {isWorkerOrAgent ? 'My Godowns' : 'View Godowns'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-center text-sm">
              {error}
            </div>
          )}

          {isAdmin && (
            <div className="mb-6 relative max-w-md mx-auto">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by godown name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            {filteredGodowns.length} godown{filteredGodowns.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mobile:gap-4 mb-6">
            {paginatedGodowns.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
                No godowns found.
              </p>
            ) : (
              paginatedGodowns.map(g => (
                <div
                  key={g.id}
                  className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700"
                >
                  {isWorkerOrAgent && (
                    <button
                      onClick={() => handleView(g.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-md"
                      title="View Godown"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  )}

                  {editingId === g.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(g.id)}
                        className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(g.id)}
                          className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg mobile:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-10">
                        {capitalize(g.name)}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                        <p>Total Cases: <strong>{g.total_cases || 0}</strong></p>
                        <p>Items: <strong>{g.stock_items || 0}</strong></p>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(g.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-white rounded transition"
                            style={{ background: styles.button.background }}
                          >
                            <FaEye /> View
                          </button>

                          <button
                            onClick={() => startEdit(g.id, g.name)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                          >
                            <FaEdit /> Edit
                          </button>

                          <button
                            onClick={() => openDeleteModal(g.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {isAdmin && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>?<br />
              <span className="text-red-600">All stock and history will be permanently deleted.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}