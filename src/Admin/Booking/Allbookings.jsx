import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import Modal from 'react-modal';
import Select from 'react-select';
import { API_BASE_URL } from '../../../Config';
import { 
  FaEye, FaDownload, FaTimes, FaSpinner, FaSearch, FaEdit, FaPlus, FaTrash, 
  FaChevronDown, FaChevronUp, FaCheckCircle, FaBell 
} from 'react-icons/fa';

Modal.setAppElement("#root");

const FloatingLabelInput = ({ value, onChange, placeholder, type = "text", className = "", ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const isActive = isFocused || (value !== undefined && value !== null && value.toString().trim() !== '');

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full rounded-lg px-4 py-2.5 border ${isActive ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} 
                   bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-0 focus:border-blue-500 peer placeholder-transparent ${className}`}
        placeholder=" "
        {...props}
      />
      <label
        onClick={() => inputRef.current?.focus()}
        className={`absolute left-4 transition-all duration-200 pointer-events-none
        ${isActive
          ? '-top-3 text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-2'
          : 'top-2.5 text-gray-500 dark:text-gray-400'
        }`}
      >
        {placeholder}
      </label>
    </div>
  );
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
    name: '', address: '', gstin: '', lr_number: '', agent_name: 'DIRECT',
    from: 'SIVAKASI', to: '', through: ''
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/booking`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));
        setBookings(sorted);
        setFilteredBookings(sorted);
      })
      .catch(() => alert('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter(b =>
      b.customer_name?.toLowerCase().includes(query) ||
      b.bill_number?.toLowerCase().includes(query)
    );
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [searchQuery, bookings]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const viewBill = async (booking) => {
    setSelectedBill(booking);
    setShowViewModal(true);
    setLoadingPDF(true);
    setPdfBlobUrl('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/pdf/${booking.id}`);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      alert('Could not load PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleEditBill = async (billId) => {
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    setEditPDFUrl('');
    setEditBillId(billId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookingi/${billId}`);
      if (!res.ok) throw new Error('Failed to load bill');

      const bill = await res.json();

      setEditCustomer({
        name: bill.customer_name || '',
        address: bill.address || '',
        gstin: bill.gstin || '',
        lr_number: bill.lr_number || '',
        agent_name: bill.agent_name || 'DIRECT',
        from: bill.from || 'SIVAKASI',
        to: bill.to || '',
        through: bill.through || ''
      });

      const loadedItems = (bill.items || []).map(item => ({
        ...item,
        cases: Number(item.cases) || 1,
        per_case: Number(item.per_case) || 1,
        rate_per_box: Number(item.rate_per_box) || 0,
        discount: Number(item.discount_percent) || 0,
        godown: item.godown || 'SIVAKASI',
        current_cases: 999999
      }));
      setEditCart(loadedItems);

      const extras = bill.extra_charges || {};
      setEditAdditionalDiscount(extras.additional_discount || 0);
      setEditPackingPercent(extras.packing_percent || 3.0);
      setEditTaxableValue(extras.taxable_value || '');
      setEditApplyProcessingFee(extras.apply_processing_fee ?? true);
      setEditApplyCGST(extras.apply_cgst ?? false);
      setEditApplySGST(extras.apply_sgst ?? false);
      setEditApplyIGST(extras.apply_igst ?? false);

      setShowEditModal(true);
    } catch (err) {
      setEditError(err.message || 'Failed to load bill for editing');
    } finally {
      setEditLoading(false);
    }
  };

const handleDeleteBill = async (billId, billNumber) => {
  if (!window.confirm(`Are you sure you want to delete bill ${billNumber}? This will restore stock but cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/booking/${billId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      // Read body as text (safe fallback – works for plain text, HTML, or JSON)
      const errorText = await res.text().catch(() => 'Unknown error');
      let errorMessage = errorText.trim() || `Delete failed (${res.status})`;

      // If it looks like JSON, try to parse message
      if (errorText.includes('{') && errorText.includes('}')) {
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {} // ignore parse fail
      }

      throw new Error(errorMessage);
    }

    // Success – no need to parse body
    setBookings(prev => prev.filter(b => b.id !== billId));
    setFilteredBookings(prev => prev.filter(b => b.id !== billId));

    alert(`Bill ${billNumber} deleted successfully and stock restored.`);

  } catch (err) {
    console.error('Delete error:', err);
    alert(err.message || 'Error deleting bill. Check console/network tab for details.');
  }
};

  const calculateEditTotals = () => {
    let subtotal = 0;
    let totalCases = 0;

    editCart.forEach(i => {
      const cases = parseFloat(i.cases) || 0;
      const perCase = parseFloat(i.per_case) || 1;
      const rate = parseFloat(i.rate_per_box) || 0;
      const discount = parseFloat(i.discount || 0) / 100;
      const amount = cases * perCase * rate * (1 - discount);
      subtotal += amount;
      totalCases += cases;
    });

    const packing = editApplyProcessingFee ? subtotal * (parseFloat(editPackingPercent) || 3) / 100 : 0;
    const extraTaxableAmt = parseFloat(editTaxableValue) || 0;
    const taxableAmount = subtotal + packing + extraTaxableAmt;
    const discountAmt = taxableAmount * (parseFloat(editAdditionalDiscount) || 0) / 100;
    const netTaxable = taxableAmount - discountAmt;

    let cgst = 0, sgst = 0, igst = 0;
    if (editApplyIGST) igst = netTaxable * 0.18;
    else if (editApplyCGST && editApplySGST) {
      cgst = netTaxable * 0.09;
      sgst = netTaxable * 0.09;
    }

    const grandTotal = Math.round(netTaxable + cgst + sgst + igst);

    return { subtotal, packing, discountAmt, taxableAmount: netTaxable, cgst, sgst, igst, grandTotal, totalCases };
  };

  const submitEdit = async () => {
    if (!editCustomer.name.trim() || editCart.length === 0 || !editCustomer.to.trim() || !editCustomer.through.trim()) {
      setEditError('Please fill all required fields');
      return;
    }

    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const payload = {
        customer_name: editCustomer.name.trim(),
        address: editCustomer.address.trim(),
        gstin: editCustomer.gstin.trim(),
        lr_number: editCustomer.lr_number.trim(),
        agent_name: editCustomer.agent_name.trim() || 'DIRECT',
        from: editCustomer.from.trim() || 'SIVAKASI',
        to: editCustomer.to.trim(),
        through: editCustomer.through.trim(),
        additional_discount: parseFloat(editAdditionalDiscount) || 0,
        packing_percent: parseFloat(editPackingPercent) || 3.0,
        taxable_value: editTaxableValue ? parseFloat(editTaxableValue) : null,
        apply_processing_fee: editApplyProcessingFee,
        apply_cgst: editApplyCGST,
        apply_sgst: editApplySGST,
        apply_igst: editApplyIGST,
        items: editCart.map(i => ({
          id: Number(i.id),
          productname: i.productname?.trim() || '',
          brand: i.brand?.trim() || '',
          cases: Number(i.cases) || 1,
          per_case: Number(i.per_case) || 1,
          discount_percent: parseFloat(i.discount) || 0,
          godown: i.godown?.trim() || 'SIVAKASI',
          rate_per_box: parseFloat(i.rate_per_box) || 0
        }))
      };

      if (!editBillId) throw new Error('No bill ID available');

      const res = await fetch(`${API_BASE_URL}/api/bookings/${editBillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to update bill');

      setEditSuccess(`Bill updated successfully!`);
      if (data.pdfBase64) setEditPDFUrl(data.pdfBase64);

      setBookings(prev => prev.map(b => 
        b.id === editBillId ? { ...b, ...payload, bill_number: b.bill_number } : b
      ));
      setFilteredBookings(prev => prev.map(b => 
        b.id === editBillId ? { ...b, ...payload, bill_number: b.bill_number } : b
      ));

    } catch (err) {
      setEditError(err.message || 'Failed to update bill');
    } finally {
      setEditLoading(false);
    }
  };

  const downloadPDF = (url) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill_${selectedBill?.bill_number || 'edited'}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading Bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-16 overflow-auto">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-xl md:text-2xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
            All Bookings
          </h2>

          <div className="mb-6 relative max-w-md mx-auto">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by customer name or bill number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {paginatedBookings.map(b => (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
                  {b.customer_name}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Bill: <span className="font-mono">{b.bill_number}</span>
                </p>
                <p className="text-xs text-sky-500 truncate">
                  {b.from} to {b.to}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(b.bill_date)}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => viewBill(b)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-1 transition"
                  >
                    <FaEye className="h-3 w-3 md:h-4 md:w-4" /> View
                  </button>

                  <button
                    onClick={() => handleEditBill(b.id)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-1 transition"
                  >
                    <FaEdit className="h-3 w-3 md:h-4 md:w-4" /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteBill(b.id, b.bill_number)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-1 transition"
                  >
                    <FaTrash className="h-3 w-3 md:h-4 md:w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
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

      {/* View Modal - unchanged */}
      <Modal
        isOpen={showViewModal}
        onRequestClose={() => setShowViewModal(false)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 outline-none overflow-hidden"
        overlayClassName="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4"
        closeTimeoutMS={200}
      >
        {selectedBill && (
          <div className="flex flex-col h-full max-h-screen">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                Bill: {selectedBill.bill_number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfBlobUrl;
                    link.download = `${selectedBill.bill_number || 'bill'}.pdf`;
                    link.click();
                  }}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1 transition"
                >
                  <FaDownload className="h-3 w-3" /> Download
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1 transition"
                >
                  <FaTimes className="h-3 w-3" /> Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 md:p-4 overflow-auto">
              {loadingPDF ? (
                <div className="flex items-center justify-center h-64">
                  <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                </div>
              ) : pdfBlobUrl ? (
                <embed
                  src={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-96 border-0"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <p className="text-center text-red-600">Failed to load PDF</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal - unchanged */}
      <Modal
        isOpen={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-4xl max-w-5xl w-full mx-4 my-8 outline-none h-[80%]"
        overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      >
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Edit Bill {selectedBill?.bill_number || ''}</h2>
            <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200">
              <FaTimes size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {editError && <div className="p-4 bg-red-100 text-red-700 rounded mb-4">{editError}</div>}
            {editSuccess && <div className="p-4 bg-green-100 text-green-700 rounded mb-4 flex items-center gap-2">
              <FaCheckCircle /> {editSuccess}
            </div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <FloatingLabelInput placeholder="Party Name *" value={editCustomer.name} onChange={e => setEditCustomer(prev => ({...prev, name: e.target.value}))} />
              <FloatingLabelInput placeholder="Address" value={editCustomer.address} onChange={e => setEditCustomer(prev => ({...prev, address: e.target.value}))} />
              <FloatingLabelInput placeholder="GSTIN" value={editCustomer.gstin} onChange={e => setEditCustomer(prev => ({...prev, gstin: e.target.value}))} />
              <FloatingLabelInput placeholder="L.R. Number" value={editCustomer.lr_number} onChange={e => setEditCustomer(prev => ({...prev, lr_number: e.target.value}))} />
              <FloatingLabelInput placeholder="From" value={editCustomer.from} onChange={e => setEditCustomer(prev => ({...prev, from: e.target.value}))} />
              <FloatingLabelInput placeholder="To *" value={editCustomer.to} onChange={e => setEditCustomer(prev => ({...prev, to: e.target.value}))} />
              <FloatingLabelInput placeholder="Through *" value={editCustomer.through} onChange={e => setEditCustomer(prev => ({...prev, through: e.target.value}))} />
            </div>

            {editCart.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-white">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="p-3 border border-white text-white font-semibold">Product</th>
                        <th className="p-3 border border-white text-white font-semibold">Cases</th>
                        <th className="p-3 border border-white text-white font-semibold">Per Case</th>
                        <th className="p-3 border border-white text-white font-semibold">Rate (₹)</th>
                        <th className="p-3 border border-white text-white font-semibold">Amount</th>
                        <th className="p-3 border border-white text-white font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editCart.map((item, idx) => {
                        const qty = item.cases * item.per_case;
                        const amountBefore = qty * item.rate_per_box;
                        const discountAmt = amountBefore * (item.discount / 100);
                        const finalAmt = amountBefore - discountAmt;
                        return (
                          <tr key={idx} className="border border-white">
                            <td className="p-3 text-center text-white border border-white">{item.productname}</td>
                            <td className="p-3 text-center border border-white">
                              <input 
                                type="number" 
                                value={item.cases} 
                                onChange={e => {
                                  const newCart = [...editCart];
                                  newCart[idx] = { ...newCart[idx], cases: parseInt(e.target.value) || 1 };
                                  setEditCart(newCart);
                                }}
                                className="w-20 p-1 border border-white rounded text-center bg-gray-800 text-white focus:outline-none focus:border-blue-400"
                              />
                            </td>
                            <td className="p-3 border border-white text-center text-white">{item.per_case}</td>
                            <td className="p-3 border border-white text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate_per_box}
                                onChange={e => {
                                  const newCart = [...editCart];
                                  newCart[idx] = { ...newCart[idx], rate_per_box: parseFloat(e.target.value) || 0 };
                                  setEditCart(newCart);
                                }}
                                className="w-24 p-1 border border-white rounded text-center bg-gray-800 text-white focus:outline-none focus:border-blue-400"
                              />
                            </td>
                            <td className="p-3 border border-white text-center font-medium text-white">₹{finalAmt.toFixed(2)}</td>
                            <td className="p-3 border border-white text-center">
                              <button 
                                onClick={() => setEditCart(editCart.filter((_, i) => i !== idx))} 
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <FaTrash />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block mb-1 text-white">Additional Discount (%)</label>
                <FloatingLabelInput type="number" value={editAdditionalDiscount} onChange={e => setEditAdditionalDiscount(e.target.value)} />
              </div>
              <div>
                <label className="flex items-center gap-2 mb-1 text-white">
                  <input type="checkbox" checked={editApplyProcessingFee} onChange={e => setEditApplyProcessingFee(e.target.checked)} />
                  Packing @ {editPackingPercent}%
                </label>
                <FloatingLabelInput type="number" step="0.1" value={editPackingPercent} onChange={e => setEditPackingPercent(e.target.value)} disabled={!editApplyProcessingFee} />
              </div>
              <div>
                <label className="block mb-1 text-white">Extra Taxable Amount</label>
                <FloatingLabelInput type="number" value={editTaxableValue} onChange={e => setEditTaxableValue(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <button onClick={() => { setEditApplyCGST(true); setEditApplySGST(true); setEditApplyIGST(false); }} className={`p-4 border-2 rounded ${editApplyCGST && editApplySGST ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                Tamil Nadu (CGST + SGST 9%)
              </button>
              <button onClick={() => { setEditApplyIGST(true); setEditApplyCGST(false); setEditApplySGST(false); }} className={`p-4 border-2 rounded ${editApplyIGST ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                Other State (IGST 18%)
              </button>
            </div>

            {(() => {
              const { grandTotal, subtotal, packing, discountAmt, taxableAmount, cgst, sgst, igst } = calculateEditTotals();
              return (
                <div className="text-right mb-6 text-white">
                  <p>Goods Value: ₹{subtotal.toFixed(2)}</p>
                  {packing > 0 && <p>Packing: ₹{packing.toFixed(2)}</p>}
                  {discountAmt > 0 && <p>Discount: -₹{discountAmt.toFixed(2)}</p>}
                  <p>Taxable: ₹{taxableAmount.toFixed(2)}</p>
                  {cgst > 0 && <p>CGST: ₹{cgst.toFixed(2)}</p>}
                  {sgst > 0 && <p>SGST: ₹{sgst.toFixed(2)}</p>}
                  {igst > 0 && <p>IGST: ₹{igst.toFixed(2)}</p>}
                  <p className="text-xl font-bold mt-2">Grand Total: ₹{grandTotal}</p>
                </div>
              );
            })()}

            {editPDFUrl && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Updated PDF Preview</h3>
                <embed src={editPDFUrl} type="application/pdf" className="w-full h-96 border" />
                <button onClick={() => downloadPDF(editPDFUrl)} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
                  Download Updated PDF
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border-t flex justify-end gap-4">
            <button onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Cancel
            </button>
            <button 
              onClick={submitEdit} 
              disabled={editLoading || editCart.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {editLoading ? <FaSpinner className="animate-spin" /> : null}
              Update Bill
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}