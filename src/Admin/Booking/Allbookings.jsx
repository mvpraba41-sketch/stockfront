import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import Modal from 'react-modal';
import Select from 'react-select';
import { API_BASE_URL } from '../../../Config';
import {
  FaEye, FaDownload, FaTimes, FaSpinner, FaSearch, FaEdit, FaTrash, FaCheckCircle
} from 'react-icons/fa';

Modal.setAppElement("#root");

/* ─── react-select dark theme ─── */
const selectStyles = {
  control: (b, s) => ({
    ...b,
    background: '#1e2330',
    borderColor: s.isFocused ? '#3fedd8' : 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    minHeight: '46px',
    boxShadow: s.isFocused ? '0 0 0 3px rgba(63,237,216,0.15)' : 'none',
    '&:hover': { borderColor: '#3fedd8' },
  }),
  menu: (b) => ({
    ...b,
    background: '#1e2330',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    zIndex: 9999,
  }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  option: (b, s) => ({
    ...b,
    background: s.isFocused ? 'rgba(63,237,216,0.12)' : s.isSelected ? 'rgba(63,237,216,0.2)' : 'transparent',
    color: '#ffffff',
    fontSize: '0.875rem',
    cursor: 'pointer',
  }),
  singleValue: (b) => ({ ...b, color: '#ffffff', fontSize: '0.875rem' }),
  placeholder: (b) => ({ ...b, color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }),
  input: (b) => ({ ...b, color: '#ffffff' }),
  indicatorSeparator: (b) => ({ ...b, background: 'rgba(255,255,255,0.1)' }),
  dropdownIndicator: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
  clearIndicator: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
};

/* ─── Field: label ABOVE input, white text ─── */
const Field = ({ label, value, onChange, type = 'text', disabled = false, step }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-white">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      step={step}
      style={type === 'date' ? { colorScheme: 'dark' } : {}}
      className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    />
  </div>
);

/* ─── Helpers: Sort by Latest Bill Number (e.g. BILL-105 > BILL-104) ─── */
const getBillNumberNumeric = (billNumber) => {
  if (!billNumber) return 0;
  const cleaned = String(billNumber).replace(/\D/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

const sortBookingsByLatestBill = (list, order = 'desc') => {
  if (!Array.isArray(list)) return [];
  const multiplier = order === 'asc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const numA = getBillNumberNumeric(a.bill_number);
    const numB = getBillNumberNumeric(b.bill_number);

    // Primary: Numeric bill number (e.g. BILL-105 > BILL-104)
    if (numB !== numA) {
      return (numB - numA) * multiplier;
    }

    // Secondary: Natural alphanumeric string sort
    const strB = String(b.bill_number || '');
    const strA = String(a.bill_number || '');
    const cmp = strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) {
      return cmp * multiplier;
    }

    // Tertiary: Fallback to database ID descending (newest database record first)
    return (Number(b.id || 0) - Number(a.id || 0)) * multiplier;
  });
};

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState({
    name: '', address: '', gstin: '', lr_number: '',
    agent_name: 'DIRECT', from: 'SIVAKASI', to: '', through: ''
  });
  const [editCart, setEditCart] = useState([]);
  const [editAdditionalDiscount, setEditAdditionalDiscount] = useState(0);
  const [editPackingPercent, setEditPackingPercent] = useState(3.0);
  const [editTaxableValue, setEditTaxableValue] = useState('');
  const [editApplyProcessingFee, setEditApplyProcessingFee] = useState(true);
  const [editApplyCGST, setEditApplyCGST] = useState(false);
  const [editApplySGST, setEditApplySGST] = useState(false);
  const [editApplyIGST, setEditApplyIGST] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editPDFUrl, setEditPDFUrl] = useState('');
  const [editBillId, setEditBillId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const formatDate = (ds) => {
    if (!ds) return '—';
    if (typeof ds === 'string') {
      const trimmed = ds.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [y, m, d] = trimmed.split('T')[0].split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
        return trimmed;
      }
    }
    const d = new Date(ds);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/booking`)
      .then(r => r.json())
      .then(data => {
        const sorted = sortBookingsByLatestBill(data, 'desc');
        setBookings(sorted);
        setFilteredBookings(sorted);
      })
      .catch(() => alert('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter(b =>
      b.customer_name?.toLowerCase().includes(q) || b.bill_number?.toLowerCase().includes(q)
    );
    setFilteredBookings(sortBookingsByLatestBill(filtered, sortOrder));
    setCurrentPage(1);
  }, [searchQuery, bookings, sortOrder]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const viewBill = async (booking) => {
    setSelectedBill(booking); setShowViewModal(true); setLoadingPDF(true); setPdfBlobUrl('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/pdf/${booking.id}`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch { alert('Could not load PDF'); }
    finally { setLoadingPDF(false); }
  };

  const handleEditBill = async (billId) => {
    setEditLoading(true); setEditError(''); setEditSuccess(''); setEditPDFUrl(''); setEditBillId(billId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookingi/${billId}`);
      if (!res.ok) throw new Error('Failed to load bill');
      const bill = await res.json();
      setEditCustomer({
        name: bill.customer_name || '', address: bill.address || '', gstin: bill.gstin || '',
        lr_number: bill.lr_number || '', agent_name: bill.agent_name || 'DIRECT',
        from: bill.from || 'SIVAKASI', to: bill.to || '', through: bill.through || ''
      });
      setEditCart((bill.items || []).map(item => ({
        ...item, cases: Number(item.cases) || 1, per_case: Number(item.per_case) || 1,
        rate_per_box: Number(item.rate_per_box) || 0, discount: Number(item.discount_percent) || 0,
        godown: item.godown || 'SIVAKASI', current_cases: 999999
      })));
      const extras = bill.extra_charges || {};
      setEditAdditionalDiscount(extras.additional_discount || 0);
      setEditPackingPercent(extras.packing_percent || 3.0);
      setEditTaxableValue(extras.taxable_value || '');
      setEditApplyProcessingFee(extras.apply_processing_fee ?? true);
      setEditApplyCGST(extras.apply_cgst ?? false);
      setEditApplySGST(extras.apply_sgst ?? false);
      setEditApplyIGST(extras.apply_igst ?? false);
      setShowEditModal(true);
    } catch (err) { setEditError(err.message || 'Failed to load'); }
    finally { setEditLoading(false); }
  };

  const handleDeleteBill = async (billId, billNumber) => {
    if (!window.confirm(`Delete bill ${billNumber}? Stock will be restored.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/${billId}`, { method: 'DELETE' });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        let msg = t || `Delete failed (${res.status})`;
        if (t.includes('{')) { try { msg = JSON.parse(t).message || msg; } catch {} }
        throw new Error(msg);
      }
      setBookings(p => p.filter(b => b.id !== billId));
      setFilteredBookings(p => p.filter(b => b.id !== billId));
      alert(`Bill ${billNumber} deleted and stock restored.`);
    } catch (err) { alert(err.message || 'Error deleting bill'); }
  };

  const calculateEditTotals = () => {
    let subtotal = 0, totalCases = 0;
    editCart.forEach(i => {
      const cases = parseFloat(i.cases) || 0, perCase = parseFloat(i.per_case) || 1;
      const rate = parseFloat(i.rate_per_box) || 0, disc = parseFloat(i.discount || 0) / 100;
      subtotal += cases * perCase * rate * (1 - disc);
      totalCases += cases;
    });
    const packing = editApplyProcessingFee ? subtotal * (parseFloat(editPackingPercent) || 3) / 100 : 0;
    const extraAmt = parseFloat(editTaxableValue) || 0;
    const taxable = subtotal + packing + extraAmt;
    const discAmt = taxable * (parseFloat(editAdditionalDiscount) || 0) / 100;
    const net = taxable - discAmt;
    let cgst = 0, sgst = 0, igst = 0;
    if (editApplyIGST) igst = net * 0.18;
    else if (editApplyCGST && editApplySGST) { cgst = net * 0.09; sgst = net * 0.09; }
    return { subtotal, packing, discAmt, net, cgst, sgst, igst, grand: Math.round(net + cgst + sgst + igst), totalCases };
  };

  const submitEdit = async () => {
    if (!editCustomer.name.trim() || editCart.length === 0 || !editCustomer.to.trim() || !editCustomer.through.trim()) {
      setEditError('Please fill all required fields'); return;
    }
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const payload = {
        customer_name: editCustomer.name.trim(), address: editCustomer.address.trim(),
        gstin: editCustomer.gstin.trim(), lr_number: editCustomer.lr_number.trim(),
        agent_name: editCustomer.agent_name.trim() || 'DIRECT',
        from: editCustomer.from.trim() || 'SIVAKASI', to: editCustomer.to.trim(),
        through: editCustomer.through.trim(),
        additional_discount: parseFloat(editAdditionalDiscount) || 0,
        packing_percent: parseFloat(editPackingPercent) || 3.0,
        taxable_value: editTaxableValue ? parseFloat(editTaxableValue) : null,
        apply_processing_fee: editApplyProcessingFee, apply_cgst: editApplyCGST,
        apply_sgst: editApplySGST, apply_igst: editApplyIGST,
        items: editCart.map(i => ({
          id: Number(i.id), productname: i.productname?.trim() || '',
          brand: i.brand?.trim() || '', cases: Number(i.cases) || 1,
          per_case: Number(i.per_case) || 1, discount_percent: parseFloat(i.discount) || 0,
          godown: i.godown?.trim() || 'SIVAKASI', rate_per_box: parseFloat(i.rate_per_box) || 0
        }))
      };
      if (!editBillId) throw new Error('No bill ID');
      const res = await fetch(`${API_BASE_URL}/api/bookings/${editBillId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      setEditSuccess('Bill updated successfully!');
      if (data.pdfBase64) setEditPDFUrl(data.pdfBase64);
      setBookings(prev => prev.map(b => b.id === editBillId ? { ...b, ...payload, bill_number: b.bill_number } : b));
      setFilteredBookings(prev => prev.map(b => b.id === editBillId ? { ...b, ...payload, bill_number: b.bill_number } : b));
    } catch (err) { setEditError(err.message || 'Failed to update'); }
    finally { setEditLoading(false); }
  };

  const totals = calculateEditTotals();

  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' };

  if (loading) return (
    <div className="flex min-h-screen bg-[#0a0c10]">
      <Sidebar /><Logout />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20">
        <FaSpinner className="animate-spin text-[#3fedd8] text-4xl" />
        <p className="text-xs uppercase tracking-widest text-white/40">Loading Bookings</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-20 overflow-auto">
        <div className="max-w-7xl mx-auto pb-10">

          {/* Heading */}
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">Records</p>
            <h1 className="text-3xl font-black tracking-tight text-white">All Bookings</h1>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-4 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name or bill number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#111318] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/15 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto mb-6 px-1">
            <p className="text-xs text-white/40 uppercase tracking-widest">
              Showing <span className="text-[#3fedd8] font-bold">{filteredBookings.length}</span> booking{filteredBookings.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Sort Order:</span>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111318] border border-white/15 text-xs text-white hover:border-[#3fedd8]/40 hover:text-[#3fedd8] transition cursor-pointer"
                title="Click to toggle sorting order"
              >
                <span>Latest Bill No</span>
                <span className="text-[#3fedd8] font-bold">{sortOrder === 'desc' ? '↓ (Newest First)' : '↑ (Oldest First)'}</span>
              </button>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {paginatedBookings.map(b => (
              <div key={b.id}
                className="bg-[#111318] border border-white/10 rounded-xl p-4 hover:border-[#3fedd8]/25 hover:-translate-y-0.5 transition-all group">
                <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[#3fedd8] to-transparent rounded-full mb-3 transition-all duration-300" />
                <p className="font-bold text-white text-sm truncate mb-1">{b.customer_name}</p>
                <p className="text-white/50 text-xs mb-0.5">
                  Bill: <span className="text-[#3fedd8] font-medium">{b.bill_number}</span>
                </p>
                <p className="text-sky-300 text-xs truncate mb-0.5">{b.from} → {b.to}</p>
                <p className="text-white/35 text-xs mb-4">{formatDate(b.bill_date)}</p>

                <div className="flex gap-1.5">
                  <button onClick={() => viewBill(b)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#3fedd8]/10 border border-[#3fedd8]/20 text-[#3fedd8] text-xs font-semibold hover:bg-[#3fedd8]/18 transition">
                    <FaEye className="text-[10px]" /> View
                  </button>
                  <button onClick={() => handleEditBill(b.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold hover:bg-amber-400/18 transition">
                    <FaEdit className="text-[10px]" /> Edit
                  </button>
                  <button onClick={() => handleDeleteBill(b.id, b.bill_number)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-400/10 border border-red-400/18 text-red-400 text-xs font-semibold hover:bg-red-400/18 transition">
                    <FaTrash className="text-[10px]" /> Del
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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

      {/* ─── View Modal ─── */}
      <Modal isOpen={showViewModal} onRequestClose={() => setShowViewModal(false)}
        className="_" overlayClassName="_"
        style={{
          overlay: modalOverlay,
          content: { position: 'relative', inset: 'unset', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }
        }}>
        {selectedBill && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center px-6 py-4 bg-[#181c24] border-b border-white/8">
              <h2 className="text-white font-black text-lg">Bill: {selectedBill.bill_number}</h2>
              <div className="flex gap-2">
                <button onClick={() => { const l = document.createElement('a'); l.href = pdfBlobUrl; l.download = `${selectedBill.bill_number || 'bill'}.pdf`; l.click(); }}
                  className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500/22 transition">
                  <FaDownload className="text-xs" /> Download
                </button>
                <button onClick={() => setShowViewModal(false)}
                  className="flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/65 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/12 transition">
                  <FaTimes className="text-xs" /> Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#0a0c10] p-4 overflow-auto">
              {loadingPDF
                ? <div className="flex items-center justify-center h-48"><FaSpinner className="animate-spin text-[#3fedd8] text-3xl" /></div>
                : pdfBlobUrl
                  ? <embed src={pdfBlobUrl} type="application/pdf" className="w-full rounded-lg" style={{ minHeight: '500px', height: '100%' }} />
                  : <p className="text-center text-red-400 pt-10">Failed to load PDF</p>
              }
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal isOpen={showEditModal} onRequestClose={() => setShowEditModal(false)}
        className="_" overlayClassName="_"
        style={{
          overlay: modalOverlay,
          content: { position: 'relative', inset: 'unset', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '1000px', height: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }
        }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 bg-[#181c24] border-b border-white/8 flex-shrink-0">
            <h2 className="text-white font-black text-lg">Edit Bill</h2>
            <button onClick={() => setShowEditModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 border border-white/10 text-white/60 hover:bg-white/12 transition">
              <FaTimes className="text-xs" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">

              {editError && <div className="p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm">{editError}</div>}
              {editSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-400/25 rounded-xl text-green-300 text-sm flex items-center gap-2">
                  <FaCheckCircle /> {editSuccess}
                </div>
              )}

              {/* Customer fields */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Customer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Party Name *" value={editCustomer.name} onChange={e => setEditCustomer(p => ({ ...p, name: e.target.value }))} />
                  <Field label="Address" value={editCustomer.address} onChange={e => setEditCustomer(p => ({ ...p, address: e.target.value }))} />
                  <Field label="GSTIN" value={editCustomer.gstin} onChange={e => setEditCustomer(p => ({ ...p, gstin: e.target.value }))} />
                  <Field label="L.R. Number" value={editCustomer.lr_number} onChange={e => setEditCustomer(p => ({ ...p, lr_number: e.target.value }))} />
                  <Field label="From" value={editCustomer.from} onChange={e => setEditCustomer(p => ({ ...p, from: e.target.value }))} />
                  <Field label="To *" value={editCustomer.to} onChange={e => setEditCustomer(p => ({ ...p, to: e.target.value }))} />
                  <Field label="Through *" value={editCustomer.through} onChange={e => setEditCustomer(p => ({ ...p, through: e.target.value }))} />
                </div>
              </div>

              {/* Line items table */}
              {editCart.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Line Items</p>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#181c24]">
                          {['Product', 'Cases', 'Per Case', 'Rate (₹)', 'Amount', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/6">
                        {editCart.map((item, idx) => {
                          const qty = item.cases * item.per_case;
                          const finalAmt = qty * item.rate_per_box * (1 - (item.discount / 100));
                          return (
                            <tr key={idx} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 text-white font-semibold text-sm whitespace-nowrap">
                                {item.productname}
                                {item.brand ? (
                                  <span className="text-[#3fedd8] text-xs ml-1.5 font-normal">
                                    ({item.brand.replace(/_/g, ' ')})
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3">
                                <input type="number" value={item.cases}
                                  onChange={e => { const nc = [...editCart]; nc[idx] = { ...nc[idx], cases: parseInt(e.target.value) || 1 }; setEditCart(nc); }}
                                  className="w-20 bg-[#1e2330] border border-white/15 rounded-md px-2 py-1.5 text-white text-sm text-center outline-none focus:border-[#3fedd8] transition" />
                              </td>
                              <td className="px-4 py-3 text-white/60 text-sm">{item.per_case}</td>
                              <td className="px-4 py-3">
                                <input type="number" step="0.01" value={item.rate_per_box}
                                  onChange={e => { const nc = [...editCart]; nc[idx] = { ...nc[idx], rate_per_box: parseFloat(e.target.value) || 0 }; setEditCart(nc); }}
                                  className="w-24 bg-[#1e2330] border border-white/15 rounded-md px-2 py-1.5 text-white text-sm text-center outline-none focus:border-[#3fedd8] transition" />
                              </td>
                              <td className="px-4 py-3 text-green-400 font-semibold text-sm whitespace-nowrap">₹{finalAmt.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => setEditCart(editCart.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-300 transition p-1">
                                  <FaTrash className="text-xs" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Charges */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Charges &amp; Tax</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <Field label="Additional Discount (%)" type="number" value={editAdditionalDiscount}
                    onChange={e => setEditAdditionalDiscount(e.target.value)} />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={editApplyProcessingFee} onChange={e => setEditApplyProcessingFee(e.target.checked)}
                        className="w-4 h-4 accent-[#3fedd8] cursor-pointer" />
                      <label className="text-sm font-semibold text-white">Packing @ {editPackingPercent}%</label>
                    </div>
                    <input type="number" step="0.1" value={editPackingPercent}
                      onChange={e => setEditPackingPercent(e.target.value)} disabled={!editApplyProcessingFee}
                      className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#3fedd8] disabled:opacity-40 transition" />
                  </div>
                  <Field label="Extra Taxable Amount" type="number" value={editTaxableValue}
                    onChange={e => setEditTaxableValue(e.target.value)} />
                </div>

                {/* GST */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setEditApplyCGST(true); setEditApplySGST(true); setEditApplyIGST(false); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      editApplyCGST && editApplySGST
                        ? 'border-green-400/50 bg-green-400/8 text-green-400'
                        : 'border-white/10 bg-[#181c24] text-white/60 hover:border-green-400/30'
                    }`}>
                    <p className="font-bold">Tamil Nadu</p>
                    <p className="text-xs opacity-65 mt-0.5">CGST 9% + SGST 9%</p>
                  </button>
                  <button
                    onClick={() => { setEditApplyIGST(true); setEditApplyCGST(false); setEditApplySGST(false); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      editApplyIGST
                        ? 'border-[#3fedd8]/50 bg-[#3fedd8]/8 text-[#3fedd8]'
                        : 'border-white/10 bg-[#181c24] text-white/60 hover:border-[#3fedd8]/30'
                    }`}>
                    <p className="font-bold">Other State</p>
                    <p className="text-xs opacity-65 mt-0.5">IGST 18%</p>
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="text-right space-y-1.5 text-sm border-t border-white/8 pt-5">
                <p className="text-white/55">Goods Value: <span className="text-white font-medium">₹{totals.subtotal.toFixed(2)}</span></p>
                {totals.packing > 0 && <p className="text-white/55">Packing: <span className="text-white font-medium">₹{totals.packing.toFixed(2)}</span></p>}
                {totals.discAmt > 0 && <p className="text-white/55">Discount: <span className="text-red-400 font-medium">−₹{totals.discAmt.toFixed(2)}</span></p>}
                <p className="text-white/55">Taxable: <span className="text-white font-medium">₹{totals.net.toFixed(2)}</span></p>
                {totals.cgst > 0 && <p className="text-white/55">CGST: <span className="text-white font-medium">₹{totals.cgst.toFixed(2)}</span></p>}
                {totals.sgst > 0 && <p className="text-white/55">SGST: <span className="text-white font-medium">₹{totals.sgst.toFixed(2)}</span></p>}
                {totals.igst > 0 && <p className="text-white/55">IGST: <span className="text-white font-medium">₹{totals.igst.toFixed(2)}</span></p>}
                <p className="text-2xl font-black text-green-400 pt-1">Grand Total: ₹{totals.grand}</p>
              </div>

              {/* PDF preview after edit */}
              {editPDFUrl && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Updated PDF</p>
                  <embed src={editPDFUrl} type="application/pdf" className="w-full rounded-xl border border-white/10" style={{ height: '300px' }} />
                  <button onClick={() => { const l = document.createElement('a'); l.href = editPDFUrl; l.download = 'bill_edited.pdf'; l.click(); }}
                    className="mt-3 flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500/22 transition">
                    <FaDownload className="text-xs" /> Download Updated PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-[#181c24] border-t border-white/8 flex-shrink-0">
            <button onClick={() => setShowEditModal(false)}
              className="px-5 py-2.5 bg-white/8 border border-white/10 text-white/65 rounded-lg text-sm font-semibold hover:bg-white/12 transition">
              Cancel
            </button>
            <button onClick={submitEdit} disabled={editLoading || editCart.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black hover:opacity-88 disabled:opacity-40 disabled:cursor-not-allowed transition">
              {editLoading ? <FaSpinner className="animate-spin" /> : null}
              Update Bill
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}