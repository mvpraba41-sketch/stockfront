import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaHistory, FaTimes, FaPlus, FaDownload, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';

Modal.setAppElement('#root');

/* ─── react-select dark theme ─── */
const selectStyles = {
  control: (b, s) => ({
    ...b, background: '#1e2330',
    borderColor: s.isFocused ? '#3fedd8' : 'rgba(255,255,255,0.15)',
    borderRadius: '8px', minHeight: '42px',
    boxShadow: s.isFocused ? '0 0 0 3px rgba(63,237,216,0.15)' : 'none',
    '&:hover': { borderColor: '#3fedd8' },
  }),
  menu: (b) => ({ ...b, background: '#1e2330', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', zIndex: 9999 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  option: (b, s) => ({ ...b, background: s.isFocused ? 'rgba(63,237,216,0.12)' : s.isSelected ? 'rgba(63,237,216,0.2)' : 'transparent', color: '#ffffff', fontSize: '0.875rem', cursor: 'pointer' }),
  singleValue: (b) => ({ ...b, color: '#ffffff', fontSize: '0.875rem' }),
  placeholder: (b) => ({ ...b, color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }),
  input: (b) => ({ ...b, color: '#ffffff' }),
  indicatorSeparator: (b) => ({ ...b, background: 'rgba(255,255,255,0.1)' }),
  dropdownIndicator: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
  clearIndicator: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
  noOptionsMessage: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
};

/* ─── Shared modal content style ─── */
const modalStyle = (maxWidth = '480px', maxHeight = '90vh') => ({
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  content: { position: 'relative', inset: 'unset', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth, maxHeight, overflow: 'auto', padding: 0 }
});

/* ─── Modal header ─── */
const ModalHeader = ({ title, onClose }) => (
  <div className="flex justify-between items-center px-6 py-4 bg-[#181c24] border-b border-white/8 sticky top-0">
    <h3 className="text-white font-black text-base">{title}</h3>
    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/8 border border-white/10 text-white/60 hover:bg-white/12 transition">
      <FaTimes className="text-xs" />
    </button>
  </div>
);

/* ─── Labelled input ─── */
const Field = ({ label, value, onChange, type = 'number', placeholder, min, max, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-white">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} disabled={disabled}
      className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 disabled:opacity-40 transition-all" />
  </div>
);

/* ─── Date button ─── */
const DateButton = ({ value, onClick, label, formatIST }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-white">{label}</label>
    <button type="button" onClick={onClick}
      className="flex items-center gap-3 bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm hover:border-[#3fedd8] transition w-full text-left">
      <FaCalendarAlt className="text-[#3fedd8] flex-shrink-0" />
      <span className={value ? 'text-white' : 'text-white/35'}>
        {value ? formatIST(value.toISOString()) : 'Today (default)'}
      </span>
    </button>
  </div>
);

export default function GodownDetail() {
  const { godownId } = useParams();

  const [godown, setGodown] = useState(null);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [casesTaken, setCasesTaken] = useState('');
  const [casesToAdd, setCasesToAdd] = useState('');
  const [stockHistory, setStockHistory] = useState([]);
  const [takeModalIsOpen, setTakeModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [historyModalIsOpen, setHistoryModalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedProductType, setSelectedProductType] = useState('all');
  const [productTypes, setProductTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTakingStock, setIsTakingStock] = useState(false);
  const cardsPerPage = 20;
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadMode, setDownloadMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [historyCache, setHistoryCache] = useState({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showUniqueProductsModal, setShowUniqueProductsModal] = useState(false);
  const [showTotalCasesModal, setShowTotalCasesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [casesAdded, setCasesAdded] = useState('');
  const [addedDate, setAddedDate] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [transferModalIsOpen, setTransferModalIsOpen] = useState(false);
  const [targetGodown, setTargetGodown] = useState(null);
  const [casesTransfer, setCasesTransfer] = useState('');
  const [transferDate, setTransferDate] = useState(null);
  const [showTransferDatePicker, setShowTransferDatePicker] = useState(false);
  const [godowns, setGodowns] = useState([]);
  const [transferring, setTransferring] = useState(false);

  const capitalize = str => str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
  const getDateString = (date) => date ? date.toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
  const formatIST = (dbDateString) => {
    if (!dbDateString) return 'Today (default)';
    return new Date(dbDateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed');
      setAllProducts(await res.json());
    } catch { console.error('Failed to load products'); }
  }, []);

  const fetchGodownsList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/fast`);
      if (!res.ok) throw new Error('Failed');
      setGodowns(await res.json());
    } catch { console.error('Failed to load godowns'); }
  };

  const fetchGodown = async () => {
    setIsLoading(true); setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock`);
      if (!response.ok) throw new Error('Failed to fetch godown details');
      const data = await response.json();
      if (data.length === 0) { setGodown({ name: 'Unknown', stocks: [] }); }
      else {
        setGodown({ name: data[0].godown_name, stocks: data });
        setProductTypes([...new Set(data.map(s => s.product_type))]);
      }
      for (const stock of data) {
        if (!historyCache[stock.id]) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/stock/${stock.id}/history`);
            const hist = await res.json();
            if (res.ok) setHistoryCache(prev => ({ ...prev, [stock.id]: hist }));
          } catch { /* silent */ }
        }
      }
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); setIsLoadingHistory(false); }
  };

  useEffect(() => { fetchGodown(); fetchAllProducts(); fetchGodownsList(); }, [godownId, fetchAllProducts]);

  const handleAddProductToGodown = async () => {
    if (!selectedProduct || !casesAdded || parseInt(casesAdded) <= 0) { setError('Select product and valid cases'); return; }
    const username = localStorage.getItem('username') || 'Unknown';
    setAddingProduct(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          godown_id: godownId, product_type: selectedProduct.product_type,
          productname: selectedProduct.productname,
          brand: selectedProduct.brand?.toLowerCase().replace(/\s+/g, '_') || '',
          cases_added: parseInt(casesAdded), added_by: username, added_date: getDateString(addedDate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add');
      setShowAddProductModal(false); setSelectedProduct(null); setCasesAdded(''); setAddedDate(null); setShowDatePicker(false); setError('');
      await fetchGodown(); await fetchAllProducts();
    } catch (err) { setError(err.message); }
    finally { setAddingProduct(false); }
  };

  const handleTakeStock = async () => {
    if (!selectedStock?.id || !casesTaken || parseInt(casesTaken) <= 0) return;
    setIsTakingStock(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/take`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_taken: parseInt(casesTaken) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed');
      setTakeModalIsOpen(false); setCasesTaken(''); setSelectedStock(null); await fetchGodown();
    } catch (err) { setError(err.message); }
    finally { setIsTakingStock(false); }
  };

  const handleAddStock = async () => {
    if (!selectedStock?.id || !casesToAdd || parseInt(casesToAdd) <= 0) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/add`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_added: parseInt(casesToAdd) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed');
      setAddModalIsOpen(false); setCasesToAdd(''); setSelectedStock(null); await fetchGodown();
    } catch (err) { setError(err.message); }
  };

  const fetchStockHistory = async (stockId) => {
    if (historyCache[stockId]) { setStockHistory(historyCache[stockId]); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/${stockId}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistoryCache(prev => ({ ...prev, [stockId]: data })); setStockHistory(data);
    } catch (err) { setError(err.message); }
  };

  const openHistoryModal = (stock) => {
    setSelectedStock(stock);
    if (historyCache[stock.id]) { setStockHistory(historyCache[stock.id]); setHistoryModalIsOpen(true); return; }
    fetchStockHistory(stock.id).then(() => setHistoryModalIsOpen(true));
  };

  const handleDeleteStock = async () => {
    if (!stockToDelete?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock/${stockToDelete.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete stock');
      setShowDeleteConfirmModal(false); setStockToDelete(null); setError(''); await fetchGodown();
    } catch (err) { setError(err.message); }
  };

  const confirmDownload = () => {
    if (!godown?.stocks?.length) { alert('No stock data to export'); return; }
    const allHistory = Object.values(historyCache).flat();
    let filtered = [];
    const toISTDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (downloadMode === 'all') filtered = allHistory;
    else if (downloadMode === 'date' && selectedDate) {
      const sel = toISTDate(selectedDate); filtered = allHistory.filter(h => toISTDate(h.date) === sel);
    } else if (downloadMode === 'month' && selectedMonth) {
      const prefix = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
      filtered = allHistory.filter(h => toISTDate(h.date).startsWith(prefix));
    }
    if (filtered.length === 0 && downloadMode !== 'all') { alert('No history found for the selected filter.'); return; }
    const wb = XLSX.utils.book_new();
    const currentStockData = godown.stocks.filter(s => s.current_cases > 0).map(s => ({
      'Product Type': capitalize(s.product_type || ''), 'Product Name': s.productname || '',
      'Brand': capitalize(s.brand || ''), 'Agent Name': s.agent_name || '-',
      'Current Cases': s.current_cases, 'Per Case': s.per_case, 'Taken Cases': s.taken_cases || 0,
      'Total Items': s.current_cases * (s.per_case || 1),
      'Date Added': s.date_added ? formatIST(s.date_added) : '-',
      'Last Taken': s.last_taken_date ? formatIST(s.last_taken_date) : '-',
    }));
    if (currentStockData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(currentStockData), 'Current Stock');
    const historyByType = {};
    filtered.forEach(h => {
      const type = capitalize(h.product_type || 'Unknown');
      if (!historyByType[type]) historyByType[type] = [];
      const performedBy = h.action === 'added' ? (h.added_by || h.taken_by || '-') : (h.taken_by || h.added_by || '-');
      historyByType[type].push({
        'Date & Time': new Date(h.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        'Product': h.productname || '', 'Brand': capitalize(h.brand || ''),
        'Action': h.action === 'added' ? 'IN (Added)' : 'OUT (Taken)',
        'Cases': h.action === 'added' ? `+${h.cases}` : `-${h.cases}`,
        'Total Qty': h.per_case_total || 0, 'Agent Name': h.agent_name || '-',
        'Performed By': performedBy, 'Customer / Note': h.customer_name || '-',
      });
    });
    for (const type in historyByType) {
      if (historyByType[type].length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historyByType[type]), type.length > 31 ? type.substring(0, 31) : type);
    }
    if (Object.keys(wb.Sheets).length === 0) { alert('No data to export.'); return; }
    const suffix = downloadMode === 'all' ? 'all' : downloadMode === 'date' ? toISTDate(selectedDate) : `${selectedMonth?.getFullYear()}-${String(selectedMonth?.getMonth() + 1 || '00').padStart(2, '0')}`;
    XLSX.writeFile(wb, `${godown?.name || 'godown'}_stock_${suffix}.xlsx`);
    setShowDownloadModal(false); setDownloadMode('all'); setSelectedDate(null); setSelectedMonth(null);
  };

  const handleTransferStock = async () => {
    if (!targetGodown || !casesTransfer || parseInt(casesTransfer) <= 0 || parseInt(casesTransfer) > selectedStock.current_cases) {
      setError('Select valid godown and cases (cannot exceed current cases)'); return;
    }
    const username = localStorage.getItem('username') || 'Unknown';
    setTransferring(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/stock/transfer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_stock_id: selectedStock.id, target_godown_id: targetGodown.value, cases_transferred: parseInt(casesTransfer), added_by: username, transfer_date: getDateString(transferDate) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to transfer');
      setTransferModalIsOpen(false); setTargetGodown(null); setCasesTransfer(''); setTransferDate(null); setShowTransferDatePicker(false); setError(''); await fetchGodown();
    } catch (err) { setError(err.message); }
    finally { setTransferring(false); }
  };

  const currentStocks = godown ? godown.stocks.filter(s => s.current_cases > 0) : [];
  const previousStocks = godown ? godown.stocks.filter(s => s.current_cases === 0) : [];
  const stocksToDisplay = activeTab === 'current' ? currentStocks : previousStocks;
  const filteredStocks = stocksToDisplay.filter(stock => {
    const matchesSearch = !searchQuery || stock.productname?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedProductType === 'all' || stock.product_type === selectedProductType;
    return matchesSearch && matchesType;
  });
  const totalPages = Math.ceil(filteredStocks.length / cardsPerPage);
  const currentCards = filteredStocks.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);
  const uniqueProducts = godown ? [...new Set(godown.stocks.map(s => s.productname))].sort() : [];
  const totalCases = godown ? godown.stocks.reduce((sum, s) => sum + (s.current_cases || 0), 0) : 0;
  const uniqueProductsData = uniqueProducts.map((name, i) => {
    const stock = godown.stocks.find(s => s.productname === name) || {};
    return { no: i + 1, product_type: capitalize(stock.product_type || 'unknown'), name };
  });
  const totalCasesData = godown ? godown.stocks.filter(s => s.current_cases > 0).map(s => ({ productname: s.productname, casecount: s.current_cases })).sort((a, b) => b.casecount - a.casecount) : [];
  const productOptions = allProducts.filter(p => !godown?.stocks?.some(s => s.productname === p.productname && s.brand === p.brand)).map(p => ({ value: p.id, label: `${p.productname} (${capitalize(p.brand || '')})`, productname: p.productname, brand: p.brand, product_type: p.product_type }));
  const searchOptions = godown?.stocks ? [...new Map(godown.stocks.map(s => [s.productname, s])).values()].map(s => ({ value: s.productname, label: `${s.productname} (${capitalize(s.brand || '')})` })).sort((a, b) => a.label.localeCompare(b.label)) : [];
  const godownOptions = godowns.filter(g => g.id !== parseInt(godownId)).map(g => ({ value: g.id, label: capitalize(g.name) }));

  if (isLoading) return (
    <div className="flex min-h-screen bg-[#0a0c10]">
      <Sidebar /><Logout />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20">
        <FaSpinner className="animate-spin text-[#3fedd8] text-4xl" />
        <p className="text-xs uppercase tracking-widest text-white/40">Loading Godown &amp; History...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-20 overflow-auto pb-10">
        <div className="max-w-5xl mx-auto">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-0.5">Inventory</p>
              <h1 className="text-2xl font-black text-white">
                {godown ? capitalize(godown.name) : 'Godown'}
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500/22 transition">
                <FaPlus className="text-xs" /> Add Product
              </button>
              <button onClick={() => setShowDownloadModal(true)} disabled={isLoadingHistory}
                className="flex items-center gap-1.5 bg-[#3fedd8]/10 border border-[#3fedd8]/20 text-[#3fedd8] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3fedd8]/18 disabled:opacity-40 transition">
                <FaDownload className="text-xs" /> {isLoadingHistory ? 'Loading...' : 'Download'}
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white/50 text-xs mb-1">Unique Products</p>
                <p className="text-2xl font-black text-white">{uniqueProducts.length}</p>
              </div>
              <button onClick={() => setShowUniqueProductsModal(true)} className="text-[#3fedd8] text-xs hover:underline font-medium">View</button>
            </div>
            <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white/50 text-xs mb-1">Total Cases</p>
                <p className="text-2xl font-black text-white">{totalCases}</p>
              </div>
              <button onClick={() => setShowTotalCasesModal(true)} className="text-[#3fedd8] text-xs hover:underline font-medium">View</button>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm">{error}</div>}

          {/* Search */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-white block mb-1.5">Search by Product Name</label>
            <Select
              options={[{ value: '', label: 'All Products' }, ...searchOptions]}
              onChange={option => setSearchQuery(option?.value || '')}
              placeholder="Type to search..." isClearable isSearchable
              styles={selectStyles} menuPortalTarget={document.body} menuPosition="fixed"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-5">
            {['current', 'previous'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold capitalize transition border-b-2 -mb-px ${
                  activeTab === tab ? 'border-[#3fedd8] text-[#3fedd8]' : 'border-transparent text-white/45 hover:text-white/70'
                }`}>
                {tab} Stock
              </button>
            ))}
          </div>

          {/* Product type filter */}
          {productTypes.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={() => setSelectedProductType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  selectedProductType === 'all' ? 'bg-[#3fedd8] text-[#0a0c10] border-[#3fedd8]' : 'bg-transparent text-white/55 border-white/15 hover:border-white/30'
                }`}>All</button>
              {productTypes.map(t => (
                <button key={t} onClick={() => setSelectedProductType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    selectedProductType === t ? 'bg-[#3fedd8] text-[#0a0c10] border-[#3fedd8]' : 'bg-transparent text-white/55 border-white/15 hover:border-white/30'
                  }`}>
                  {capitalize(t)}
                </button>
              ))}
            </div>
          )}

          {/* Stock grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {currentCards.length === 0
              ? <p className="col-span-full text-center text-white/30 py-10">No {activeTab} stocks available.</p>
              : currentCards.map(s => (
                  <div key={s.id} className="bg-[#111318] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-3">
                        <h3 className="font-bold text-white text-sm truncate">
                          {s.productname}
                          <span className="text-sky-400 font-normal ml-1">({capitalize(s.brand || '')})</span>
                        </h3>
                        <p className="text-white/45 text-xs mt-0.5">{capitalize(s.product_type)}</p>
                        <p className="text-sky-300 text-xs mt-0.5">A: {s.agent_name || '—'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-black text-sm flex-shrink-0">
                        {s.current_cases}
                      </div>
                    </div>
                    <p className="text-white/50 text-xs mb-4">Per Case: <span className="text-white font-semibold">{s.per_case}</span></p>
                    <div className="flex gap-1.5">
                      <button onClick={() => openHistoryModal(s)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-[#3fedd8] bg-[#3fedd8]/10 border border-[#3fedd8]/20 rounded-lg hover:bg-[#3fedd8]/18 transition font-semibold">
                        <FaHistory className="text-[10px]" /> History
                      </button>
                      {localStorage.getItem('userType') === 'admin' && (
                        <button onClick={() => { setStockToDelete(s); setShowDeleteConfirmModal(true); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 bg-red-400/10 border border-red-400/18 rounded-lg hover:bg-red-400/18 transition font-semibold">
                          <FaTimes className="text-[10px]" /> Clear
                        </button>
                      )}
                      <button onClick={() => { setSelectedStock(s); setCasesTransfer(''); setTargetGodown(null); setTransferDate(null); setShowTransferDatePicker(false); setTransferModalIsOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/18 rounded-lg hover:bg-amber-400/18 transition font-semibold">
                        Transfer
                      </button>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 flex-wrap">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[#111318] border border-white/10 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition">
                ← Prev
              </button>
              <span className="text-sm text-white/50 px-2">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#111318] border border-white/10 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADD PRODUCT MODAL ─── */}
      <Modal isOpen={showAddProductModal} onRequestClose={() => { setShowAddProductModal(false); setSelectedProduct(null); setCasesAdded(''); setAddedDate(null); setShowDatePicker(false); setError(''); }} className="_" overlayClassName="_" style={modalStyle()}>
        <ModalHeader title="Add Product to Godown" onClose={() => setShowAddProductModal(false)} />
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-white">Product</label>
            <Select value={selectedProduct} onChange={setSelectedProduct} options={productOptions} placeholder="Search product..." isSearchable isClearable styles={selectStyles} menuPortalTarget={document.body} menuPosition="fixed" noOptionsMessage={() => 'No products available'} />
          </div>
          <Field label="Cases" value={casesAdded} onChange={e => setCasesAdded(e.target.value)} placeholder="10" min="1" />
          <div>
            <DateButton label="Added Date" value={addedDate} onClick={() => setShowDatePicker(!showDatePicker)} formatIST={formatIST} />
            {showDatePicker && (
              <div className="mt-2 z-50">
                <DatePicker selected={addedDate} onChange={(date) => { setAddedDate(date); setShowDatePicker(false); }} onClickOutside={() => setShowDatePicker(false)} inline maxDate={new Date()} />
              </div>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAddProductModal(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/6 transition">Cancel</button>
            <button onClick={handleAddProductToGodown} disabled={addingProduct || !selectedProduct || !casesAdded}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-green-500 transition">
              {addingProduct ? <><FaSpinner className="animate-spin" /> Adding...</> : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── TAKE MODAL ─── */}
      <Modal isOpen={takeModalIsOpen} onRequestClose={() => { setTakeModalIsOpen(false); setCasesTaken(''); setSelectedStock(null); }} className="_" overlayClassName="_" style={modalStyle('400px')}>
        <ModalHeader title="Take Cases" onClose={() => setTakeModalIsOpen(false)} />
        <div className="p-6 space-y-4">
          <Field label="Cases to Take" value={casesTaken} onChange={e => setCasesTaken(e.target.value)} placeholder="Enter cases" min="1" disabled={isTakingStock} />
          <button onClick={handleTakeStock} disabled={isTakingStock}
            className="w-full py-3 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black disabled:opacity-40 hover:opacity-88 transition">
            {isTakingStock ? 'Submitting...' : 'Take'}
          </button>
        </div>
      </Modal>

      {/* ─── ADD STOCK MODAL ─── */}
      <Modal isOpen={addModalIsOpen} onRequestClose={() => { setAddModalIsOpen(false); setCasesToAdd(''); setSelectedStock(null); }} className="_" overlayClassName="_" style={modalStyle('400px')}>
        <ModalHeader title="Add Cases" onClose={() => setAddModalIsOpen(false)} />
        <div className="p-6 space-y-4">
          <Field label="Cases to Add" value={casesToAdd} onChange={e => setCasesToAdd(e.target.value)} placeholder="Enter cases" min="1" />
          <button onClick={handleAddStock} className="w-full py-3 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black hover:opacity-88 transition">Add</button>
        </div>
      </Modal>

      {/* ─── HISTORY MODAL ─── */}
      <Modal isOpen={historyModalIsOpen} onRequestClose={() => { setHistoryModalIsOpen(false); setStockHistory([]); }} className="_" overlayClassName="_" style={modalStyle('860px', '85vh')}>
        <ModalHeader
          title={`History — ${selectedStock?.productname || 'Product'} (${capitalize(selectedStock?.brand || '')})`}
          onClose={() => setHistoryModalIsOpen(false)}
        />
        <div className="p-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#181c24]">
                {['No','Date','Action','Cases','Total Qty','Agent','Performed By','Customer'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {stockHistory.length > 0
                ? stockHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map((h, i) => (
                    <tr key={i} className={`transition ${h.action === 'added' ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5'}`}>
                      <td className="px-3 py-3 text-white/35 text-xs">{i + 1}</td>
                      <td className="px-3 py-3 text-white text-xs whitespace-nowrap">
                        {new Date(h.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={`px-3 py-3 text-xs font-bold ${h.action === 'added' ? 'text-green-400' : 'text-red-400'}`}>
                        {h.action === 'added' ? 'IN' : 'OUT'}
                      </td>
                      <td className={`px-3 py-3 text-sm font-bold ${h.action === 'added' ? 'text-green-400' : 'text-red-400'}`}>
                        {h.action === 'added' ? `+${h.cases}` : `-${h.cases}`}
                      </td>
                      <td className="px-3 py-3 text-white text-xs">{h.per_case_total || 0}</td>
                      <td className="px-3 py-3 text-white/60 text-xs">{h.agent_name || '—'}</td>
                      <td className="px-3 py-3 text-sky-400 text-xs font-medium">
                        {h.action === 'added' ? (h.added_by || '—') : (h.taken_by || '—')}
                      </td>
                      <td className="px-3 py-3 text-sky-400 text-xs font-medium">
                        {h.action === 'taken' ? (h.customer_name || '—') : '—'}
                      </td>
                    </tr>
                  ))
                : <tr><td colSpan={8} className="px-3 py-10 text-center text-white/30 text-sm">No history available</td></tr>
              }
            </tbody>
          </table>
          {stockHistory.length > 0 && (
            <div className="mt-4 flex gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/30 inline-block" /> IN (Added)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30 inline-block" /> OUT (Taken)</span>
            </div>
          )}
        </div>
      </Modal>

      {/* ─── DOWNLOAD MODAL ─── */}
      <Modal isOpen={showDownloadModal} onRequestClose={() => setShowDownloadModal(false)} className="_" overlayClassName="_" style={modalStyle('420px')}>
        <ModalHeader title="Download Stock History" onClose={() => setShowDownloadModal(false)} />
        <div className="p-6 space-y-3">
          {[
            { val: 'all', label: 'All History' },
            { val: 'date', label: 'Specific Date' },
            { val: 'month', label: 'Specific Month' },
          ].map(opt => (
            <label key={opt.val} className="flex items-center gap-3 cursor-pointer py-2">
              <input type="radio" name="mode" value={opt.val} checked={downloadMode === opt.val} onChange={e => setDownloadMode(e.target.value)} className="accent-[#3fedd8] w-4 h-4" />
              <span className="text-white text-sm font-medium">{opt.label}</span>
            </label>
          ))}
          {downloadMode === 'date' && (
            <DatePicker selected={selectedDate} onChange={d => setSelectedDate(d)}
              className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#3fedd8] transition"
              placeholderText="Select date" dateFormat="yyyy-MM-dd" />
          )}
          {downloadMode === 'month' && (
            <DatePicker selected={selectedMonth} onChange={d => setSelectedMonth(d)} showMonthYearPicker dateFormat="MM/yyyy"
              className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#3fedd8] transition"
              placeholderText="Select month" />
          )}
          <div className="flex gap-3 pt-3">
            <button onClick={() => setShowDownloadModal(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/6 transition">Cancel</button>
            <button onClick={confirmDownload}
              disabled={isLoadingHistory || (downloadMode === 'date' && !selectedDate) || (downloadMode === 'month' && !selectedMonth)}
              className="flex-1 py-2.5 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black disabled:opacity-40 hover:opacity-88 transition">
              {isLoadingHistory ? 'Loading...' : 'Download'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── UNIQUE PRODUCTS MODAL ─── */}
      <Modal isOpen={showUniqueProductsModal} onRequestClose={() => setShowUniqueProductsModal(false)} className="_" overlayClassName="_" style={modalStyle('600px', '80vh')}>
        <ModalHeader title="Unique Products" onClose={() => setShowUniqueProductsModal(false)} />
        <div className="p-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#181c24]">
                {['No','Product Type','Name'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {uniqueProductsData.map(p => (
                <tr key={p.no} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/35 text-xs">{p.no}</td>
                  <td className="px-4 py-3 text-white text-sm">{p.product_type}</td>
                  <td className="px-4 py-3 text-white font-medium text-sm">{p.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─── TOTAL CASES MODAL ─── */}
      <Modal isOpen={showTotalCasesModal} onRequestClose={() => setShowTotalCasesModal(false)} className="_" overlayClassName="_" style={modalStyle('560px', '80vh')}>
        <ModalHeader title="Total Cases by Product" onClose={() => setShowTotalCasesModal(false)} />
        <div className="p-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#181c24]">
                {['Product Name','Case Count'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {totalCasesData.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white text-sm font-medium">{c.productname}</td>
                  <td className="px-4 py-3 text-green-400 font-bold text-sm">{c.casecount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─── DELETE CONFIRM MODAL ─── */}
      <Modal isOpen={showDeleteConfirmModal} onRequestClose={() => { setShowDeleteConfirmModal(false); setStockToDelete(null); }} className="_" overlayClassName="_" style={modalStyle('420px')}>
        <ModalHeader title="Clear Stock Entry" onClose={() => { setShowDeleteConfirmModal(false); setStockToDelete(null); }} />
        <div className="p-6">
          <p className="text-white/70 text-sm mb-2">Are you sure you want to permanently delete this stock entry?</p>
          <p className="text-white font-bold text-sm mb-1">{stockToDelete?.productname} ({capitalize(stockToDelete?.brand || '')})</p>
          <p className="text-red-400 text-xs font-medium mb-6">All history records will also be deleted. This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => { setShowDeleteConfirmModal(false); setStockToDelete(null); }}
              className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/6 transition">Cancel</button>
            <button onClick={handleDeleteStock}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500 transition">Yes, Delete</button>
          </div>
        </div>
      </Modal>

      {/* ─── TRANSFER MODAL ─── */}
      <Modal isOpen={transferModalIsOpen} onRequestClose={() => { setTransferModalIsOpen(false); setTargetGodown(null); setCasesTransfer(''); setTransferDate(null); setShowTransferDatePicker(false); setError(''); }} className="_" overlayClassName="_" style={modalStyle()}>
        <ModalHeader title="Transfer Stock" onClose={() => setTransferModalIsOpen(false)} />
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-white">Target Godown</label>
            <Select value={targetGodown} onChange={setTargetGodown} options={godownOptions} placeholder="Select godown..." isSearchable isClearable styles={selectStyles} menuPortalTarget={document.body} menuPosition="fixed" noOptionsMessage={() => 'No other godowns available'} />
          </div>
          <div>
            <Field label={`Cases to Transfer (max: ${selectedStock?.current_cases || 0})`} value={casesTransfer} onChange={e => setCasesTransfer(e.target.value)} placeholder="10" min="1" max={selectedStock?.current_cases} />
          </div>
          <div>
            <DateButton label="Transfer Date" value={transferDate} onClick={() => setShowTransferDatePicker(!showTransferDatePicker)} formatIST={formatIST} />
            {showTransferDatePicker && (
              <div className="mt-2">
                <DatePicker selected={transferDate} onChange={(date) => { setTransferDate(date); setShowTransferDatePicker(false); }} onClickOutside={() => setShowTransferDatePicker(false)} inline maxDate={new Date()} />
              </div>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setTransferModalIsOpen(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/6 transition">Cancel</button>
            <button onClick={handleTransferStock} disabled={transferring || !targetGodown || !casesTransfer}
              className="flex-1 py-2.5 bg-amber-500 text-black rounded-lg text-sm font-black disabled:opacity-40 hover:opacity-88 flex items-center justify-center gap-2 transition">
              {transferring ? <><FaSpinner className="animate-spin" /> Transferring...</> : 'Transfer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}