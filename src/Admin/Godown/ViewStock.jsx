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

  const capitalize = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const fetchGodowns = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/fast`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGodowns(data || []); setFilteredGodowns(data || []);
    } catch (err) { setError('Failed to load godowns. Please try again.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGodowns(); }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const q = searchQuery.toLowerCase().trim();
    setFilteredGodowns(godowns.filter(g => g.name?.toLowerCase().includes(q)));
    setCurrentPage(1);
  }, [searchQuery, godowns, isAdmin]);

  const totalPages = isAdmin ? Math.ceil(filteredGodowns.length / itemsPerPage) : 1;
  const paginatedGodowns = isAdmin
    ? filteredGodowns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredGodowns;

  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
  const handleView = (id) => navigate(`/view-stocks/${id}`);

  const startEdit = (id, currentName) => { setEditingId(id); setEditName(capitalize(currentName)); };
  const cancelEdit = () => { setEditingId(null); setEditName(''); };

  const saveEdit = async (id) => {
    const trimmed = editName.trim();
    if (!trimmed) return alert('Name is required');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setGodowns(prev => prev.map(g => g.id === id ? { ...g, name: data.name } : g));
      cancelEdit();
    } catch (err) { alert(err.message); }
  };

  const openDeleteModal = (id) => {
    const g = godowns.find(g => g.id === id);
    if (!g) return;
    setDeleteModal({ open: true, id, name: capitalize(g.name) });
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Delete failed'); }
      setGodowns(prev => prev.filter(g => g.id !== id));
      setDeleteModal({ open: false, id: null, name: '' });
    } catch (err) { alert(err.message); setDeleteModal({ open: false, id: null, name: '' }); }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#0a0c10]">
      <Sidebar /><Logout />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20">
        <FaSpinner className="animate-spin text-[#3fedd8] text-4xl" />
        <p className="text-xs uppercase tracking-widest text-white/40">Loading Godowns</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-20 overflow-auto pb-10">
        <div className="max-w-7xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">Inventory</p>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {isWorkerOrAgent ? 'My Godowns' : 'View Godowns'}
            </h1>
          </div>

          {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm text-center">{error}</div>}

          {/* Search */}
          {isAdmin && (
            <div className="max-w-md mx-auto mb-4 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none" />
              <input
                type="text" placeholder="Search by godown name..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#111318] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/15 transition"
              />
            </div>
          )}

          <p className="text-center text-xs text-white/35 uppercase tracking-widest mb-6">
            {filteredGodowns.length} godown{filteredGodowns.length !== 1 ? 's' : ''}
          </p>

          {/* Godown grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {paginatedGodowns.length === 0
              ? <p className="col-span-full text-center text-white/30 py-10">No godowns found.</p>
              : paginatedGodowns.map(g => (
                  <div key={g.id}
                    className="bg-[#111318] border border-white/10 rounded-xl p-5 hover:border-white/20 hover:-translate-y-0.5 transition-all group">

                    {/* Worker/Agent: eye button in corner */}
                    {isWorkerOrAgent && (
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-white text-base">{capitalize(g.name)}</h3>
                        <button onClick={() => handleView(g.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3fedd8]/10 border border-[#3fedd8]/20 text-[#3fedd8] hover:bg-[#3fedd8]/18 transition">
                          <FaEye className="text-xs" />
                        </button>
                      </div>
                    )}

                    {/* Admin: edit mode */}
                    {isAdmin && (
                      <>
                        {editingId === g.id ? (
                          <div className="space-y-3">
                            <input
                              type="text" value={editName} onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit(g.id)} autoFocus
                              className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#3fedd8] transition"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(g.id)}
                                className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-500 transition font-semibold">Save</button>
                              <button onClick={cancelEdit}
                                className="flex-1 py-1.5 text-xs bg-white/10 text-white/70 rounded-lg hover:bg-white/15 transition font-semibold">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-bold text-white text-base mb-1">{capitalize(g.name)}</h3>
                            <div className="space-y-0.5 mb-4">
                              <p className="text-white/50 text-xs">
                                Total Cases: <span className="text-white font-semibold">{g.total_cases || 0}</span>
                              </p>
                              <p className="text-white/50 text-xs">
                                Items: <span className="text-white font-semibold">{g.stock_items || 0}</span>
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleView(g.id)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-[#3fedd8] bg-[#3fedd8]/10 border border-[#3fedd8]/20 rounded-lg hover:bg-[#3fedd8]/18 transition font-semibold">
                                <FaEye className="text-[10px]" /> View
                              </button>
                              <button onClick={() => startEdit(g.id, g.name)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg hover:bg-amber-400/18 transition font-semibold">
                                <FaEdit className="text-[10px]" /> Edit
                              </button>
                              <button onClick={() => openDeleteModal(g.id)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-red-400 bg-red-400/10 border border-red-400/18 rounded-lg hover:bg-red-400/18 transition font-semibold">
                                <FaTrash className="text-[10px]" /> Del
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* Worker card bottom */}
                    {isWorkerOrAgent && (
                      <div className="space-y-0.5">
                        <p className="text-white/50 text-xs">Total Cases: <span className="text-white font-semibold">{g.total_cases || 0}</span></p>
                        <p className="text-white/50 text-xs">Items: <span className="text-white font-semibold">{g.stock_items || 0}</span></p>
                      </div>
                    )}
                  </div>
                ))
            }
          </div>

          {/* Pagination */}
          {isAdmin && totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 flex-wrap">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[#111318] border border-white/10 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentPage === p
                      ? 'bg-[#3fedd8] text-[#0a0c10] font-bold'
                      : 'bg-[#111318] border border-white/10 text-white/60 hover:border-white/20'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#111318] border border-white/10 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111318] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-white mb-4">Confirm Delete</h3>
            <p className="text-white/70 text-sm mb-2">
              Are you sure you want to delete <span className="text-white font-bold">{deleteModal.name}</span>?
            </p>
            <p className="text-red-400 text-xs font-medium mb-6">All stock and history will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ open: false, id: null, name: '' })}
                className="flex-1 py-2.5 text-sm font-semibold text-white/70 bg-white/8 border border-white/10 rounded-lg hover:bg-white/12 transition">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}