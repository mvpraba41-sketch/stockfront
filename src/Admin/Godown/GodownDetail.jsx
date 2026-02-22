import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import {
  FaHistory, FaTimes, FaPlus, FaDownload,
  FaSpinner, FaSearch, FaCalendarAlt
} from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';

Modal.setAppElement('#root');

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

  // Delete feature states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);

  // Transfer feature states
  const [transferModalIsOpen, setTransferModalIsOpen] = useState(false);
  const [targetGodown, setTargetGodown] = useState(null);
  const [casesTransfer, setCasesTransfer] = useState('');
  const [transferDate, setTransferDate] = useState(null);
  const [showTransferDatePicker, setShowTransferDatePicker] = useState(false);
  const [godowns, setGodowns] = useState([]);
  const [transferring, setTransferring] = useState(false);

  const styles = {
    input: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))',
      backgroundDark: 'linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(2,132,199,0.3)',
      borderDark: '1px solid rgba(59,130,246,0.4)',
    },
    button: {
      background: 'linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))',
      backgroundDark: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(125,211,252,0.4)',
      borderDark: '1px solid rgba(147,197,253,0.4)',
      boxShadow: '0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      boxShadowDark: '0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    },
  };

  const capitalize = str =>
    str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

  // Replace your existing getISTDateString with this:
  const getDateString = (date) => {
    if (!date) {
      return new Date().toLocaleDateString('en-CA'); // "2026-02-07" (today in IST)
    }
    return date.toLocaleDateString('en-CA'); // "YYYY-MM-DD" in local timezone (IST)
  };

  // When displaying any date from backend (which is stored as IST)
  const formatIST = (dbDateString) => {
    if (!dbDateString) return 'Today (default)';
    // dbDateString is like "2025-02-01" or "2025-02-01T00:00:00"
    const d = new Date(dbDateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllProducts(data);
    } catch (err) {
      console.error('Failed to load products');
    }
  }, []);

  const fetchGodowns = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/fast`);
      if (!res.ok) throw new Error('Failed to fetch godowns');
      const data = await res.json();
      setGodowns(data);
    } catch (err) {
      console.error('Failed to load godowns:', err);
    }
  };

  const fetchGodown = async () => {
    setIsLoading(true);
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock`);
      if (!response.ok) throw new Error('Failed to fetch godown details');
      const data = await response.json();

      if (data.length === 0) {
        setGodown({ name: 'Unknown', stocks: [] });
      } else {
        setGodown({ name: data[0].godown_name, stocks: data });
        const uniqueTypes = [...new Set(data.map(s => s.product_type))];
        setProductTypes(uniqueTypes);
      }

      // Pre-fetch history
      for (const stock of data) {
        if (!historyCache[stock.id]) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/stock/${stock.id}/history`);
            if (res.ok) {
              const hist = await res.json();
              setHistoryCache(prev => ({ ...prev, [stock.id]: hist }));
            }
          } catch (e) { /* silent fail */ }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchGodown();
    fetchAllProducts();
    fetchGodowns();
  }, [godownId, fetchAllProducts]);

  const handleAddProductToGodown = async () => {
    if (!selectedProduct || !casesAdded || parseInt(casesAdded) <= 0) {
      setError('Select product and valid cases');
      return;
    }

    const username = localStorage.getItem('username') || 'Unknown';

    setAddingProduct(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/${godownId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          godown_id: godownId,
          product_type: selectedProduct.product_type,
          productname: selectedProduct.productname,
          brand: selectedProduct.brand?.toLowerCase().replace(/\s+/g, '_') || '',
          cases_added: parseInt(casesAdded),
          added_by: username,
          added_date: getDateString(addedDate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add');

      setShowAddProductModal(false);
      setSelectedProduct(null);
      setCasesAdded('');
      setAddedDate(null);
      setShowDatePicker(false);
      setError('');
      await fetchGodown();
      await fetchAllProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleTakeStock = async () => {
    if (!selectedStock?.id || !casesTaken || parseInt(casesTaken) <= 0) return;
    setIsTakingStock(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/take`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_taken: parseInt(casesTaken) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed');
      setTakeModalIsOpen(false);
      setCasesTaken('');
      setSelectedStock(null);
      await fetchGodown();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTakingStock(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedStock?.id || !casesToAdd || parseInt(casesToAdd) <= 0) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/godowns/stock/add`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStock.id, cases_added: parseInt(casesToAdd) }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed');
      setAddModalIsOpen(false);
      setCasesToAdd('');
      setSelectedStock(null);
      await fetchGodown();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchStockHistory = async (stockId) => {
    if (historyCache[stockId]) {
      setStockHistory(historyCache[stockId]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/stock/${stockId}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistoryCache(prev => ({ ...prev, [stockId]: data }));
      setStockHistory(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const openHistoryModal = (stock) => {
    setSelectedStock(stock);

    if (historyCache[stock.id]) {
      setStockHistory(historyCache[stock.id]);
      setHistoryModalIsOpen(true);
      return;
    }

    fetchStockHistory(stock.id).then(() => {
      setHistoryModalIsOpen(true);
    });
  };

  const handleDeleteStock = async () => {
    if (!stockToDelete?.id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/godowns/${godownId}/stock/${stockToDelete.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete stock');
      }

      setShowDeleteConfirmModal(false);
      setStockToDelete(null);
      setError('');
      await fetchGodown();
    } catch (err) {
      setError(err.message);
    }
  };

  const openDownloadModal = () => setShowDownloadModal(true);

  const confirmDownload = () => {
    if (!godown?.stocks?.length) {
      alert('No stock data to export');
      return;
    }

    const allHistory = Object.values(historyCache).flat();
    let filtered = [];

    const toISTDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };

    if (downloadMode === 'all') {
      filtered = allHistory;
    } else if (downloadMode === 'date' && selectedDate) {
      const selectedIST = toISTDate(selectedDate);
      filtered = allHistory.filter(h => toISTDate(h.date) === selectedIST);
    } else if (downloadMode === 'month' && selectedMonth) {
      const year = selectedMonth.getFullYear();
      const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      filtered = allHistory.filter(h => toISTDate(h.date).startsWith(prefix));
    }

    if (filtered.length === 0 && downloadMode !== 'all') {
      alert('No history found for the selected filter.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // ─── Current Stock Sheet ─────────────────────────────────────────────────────
    const currentStockData = godown.stocks
      .filter(s => s.current_cases > 0)
      .map(s => ({
        'Product Type': capitalize(s.product_type || ''),
        'Product Name': s.productname || '',
        'Brand': capitalize(s.brand || ''),
        'Agent Name': s.agent_name || '-',
        'Current Cases': s.current_cases,
        'Per Case': s.per_case,
        'Taken Cases': s.taken_cases || 0,
        'Total Items': s.current_cases * (s.per_case || 1),
        'Date Added': s.date_added ? formatIST(s.date_added) : '-',
        'Last Taken': s.last_taken_date ? formatIST(s.last_taken_date) : '-',
      }));

    if (currentStockData.length > 0) {
      const wsCurrent = XLSX.utils.json_to_sheet(currentStockData);
      XLSX.utils.book_append_sheet(wb, wsCurrent, 'Current Stock');
    }

    // ─── History Sheet – Now with customer_name & correct Performed By ───────────
    const historyByType = {};
    filtered.forEach(h => {
      const type = capitalize(h.product_type || 'Unknown');
      if (!historyByType[type]) historyByType[type] = [];

      // Performed By logic: prioritize taken_by for OUT, added_by for IN
      let performedBy = '-';
      if (h.action === 'added') {
        performedBy = h.added_by || h.taken_by || '-';
      } else if (h.action === 'taken') {
        performedBy = h.taken_by || h.added_by || '-';
      }

      historyByType[type].push({
        'Date & Time': new Date(h.date).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        }),
        'Product': h.productname || '',
        'Brand': capitalize(h.brand || ''),
        'Action': h.action === 'added' ? 'IN (Added)' : 'OUT (Taken)',
        'Cases': h.action === 'added' ? `+${h.cases}` : `-${h.cases}`,
        'Total Qty': h.per_case_total || 0,
        'Agent Name': h.agent_name || '-',
        'Performed By': performedBy,
        'Customer / Note': h.customer_name || '-',   // ← Now included!
      });
    });

    for (const type in historyByType) {
      if (historyByType[type].length > 0) {
        const ws = XLSX.utils.json_to_sheet(historyByType[type]);
        const safeName = type.length > 31 ? type.substring(0, 31) : type;
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      }
    }

    if (Object.keys(wb.Sheets).length === 0) {
      alert('No data to export.');
      return;
    }

    const suffix =
      downloadMode === 'all' ? 'all' :
      downloadMode === 'date' ? toISTDate(selectedDate) :
      `${selectedMonth?.getFullYear() || 'year'}-${String(selectedMonth?.getMonth() + 1 || '00').padStart(2, '0')}`;

    XLSX.writeFile(wb, `${godown?.name || 'godown'}_stock_${suffix}.xlsx`);

    setShowDownloadModal(false);
    setDownloadMode('all');
    setSelectedDate(null);
    setSelectedMonth(null);
  };

  const openTakeModal = stock => {
    setSelectedStock(stock);
    setCasesTaken('');
    setTakeModalIsOpen(true);
  };

  const openAddModal = stock => {
    setSelectedStock(stock);
    setCasesToAdd('');
    setAddModalIsOpen(true);
  };

  const openTransferModal = stock => {
    setSelectedStock(stock);
    setCasesTransfer('');
    setTargetGodown(null);
    setTransferDate(null);
    setShowTransferDatePicker(false);
    setTransferModalIsOpen(true);
  };

  const handleTransferStock = async () => {
    if (
      !targetGodown ||
      !casesTransfer ||
      parseInt(casesTransfer) <= 0 ||
      parseInt(casesTransfer) > selectedStock.current_cases
    ) {
      setError('Select valid godown and cases (cannot exceed current cases)');
      return;
    }

    const username = localStorage.getItem('username') || 'Unknown';

    setTransferring(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/stock/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_stock_id: selectedStock.id,
          target_godown_id: targetGodown.value,
          cases_transferred: parseInt(casesTransfer),
          added_by: username,
          transfer_date: getDateString(transferDate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to transfer');

      setTransferModalIsOpen(false);
      setTargetGodown(null);
      setCasesTransfer('');
      setTransferDate(null);
      setShowTransferDatePicker(false);
      setError('');
      await fetchGodown();
    } catch (err) {
      setError(err.message);
    } finally {
      setTransferring(false);
    }
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
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredStocks.slice(indexOfFirstCard, indexOfLastCard);

  const uniqueProducts = godown
    ? [...new Set(godown.stocks.map(s => s.productname))].sort()
    : [];

  const totalCases = godown
    ? godown.stocks.reduce((sum, s) => sum + (s.current_cases || 0), 0)
    : 0;

  const uniqueProductsData = uniqueProducts.map((name, i) => {
    const stock = godown.stocks.find(s => s.productname === name) || {};
    return {
      no: i + 1,
      product_type: capitalize(stock.product_type || 'unknown'),
      name
    };
  });

  const totalCasesData = godown
    ? godown.stocks
        .filter(s => s.current_cases > 0)
        .map(s => ({ productname: s.productname, casecount: s.current_cases }))
        .sort((a, b) => b.casecount - a.casecount)
    : [];

  const productOptions = allProducts
    .filter(p => !godown?.stocks?.some(s => s.productname === p.productname && s.brand === p.brand))
    .map(p => ({
      value: p.id,
      label: `${p.productname} (${capitalize(p.brand || '')})`,
      productname: p.productname,
      brand: p.brand,
      product_type: p.product_type,
    }));

  const searchOptions = godown?.stocks
    ? [...new Map(godown.stocks.map(s => [s.productname, s])).values()]
        .map(s => ({
          value: s.productname,
          label: `${s.productname} (${capitalize(s.brand || '')})`
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const godownOptions = godowns
    .filter(g => g.id !== parseInt(godownId))
    .map(g => ({
      value: g.id,
      label: capitalize(g.name),
    }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-90 flex items-center justify-center z-40">
            <div className="flex flex-col items-center">
              <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Loading Godown & History...
              </p>
            </div>
          </div>
          <div className="p-6 pt-16 min-h-screen opacity-0">&nbsp;</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex mobile:flex-col mobile:gap-4 justify-between items-center mb-6 mobile:mb-4">
            <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-100">
              View Stocks for {godown ? capitalize(godown.name) : 'Godown'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center rounded-md px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: styles.button.border }}
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add Product
              </button>
              <button
                onClick={openDownloadModal}
                disabled={isLoadingHistory}
                className="flex items-center rounded-md px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
              >
                <FaDownload className="mr-2 h-4 w-4 mobile:h-3 mobile:w-3" />
                {isLoadingHistory ? 'Loading...' : 'Download History'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{uniqueProducts.length}</p>
              </div>
              <button
                onClick={() => setShowUniqueProductsModal(true)}
                className="text-indigo-600 hover:underline text-sm"
              >
                View
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCases}</p>
              </div>
              <button
                onClick={() => setShowTotalCasesModal(true)}
                className="text-indigo-600 hover:underline text-sm"
              >
                View
              </button>
            </div>
          </div>

          {error && <div className="mb-4 text-red-600 dark:text-red-400 text-center">{error}</div>}

          <div className="mb-6 mobile:mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search by Product Name
            </label>
            <Select
              options={[{ value: '', label: 'All Products' }, ...searchOptions]}
              onChange={option => setSearchQuery(option?.value || '')}
              placeholder="Type to search..."
              isClearable
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  background: styles.input.background,
                  border: styles.input.border,
                  backdropFilter: styles.input.backdropFilter,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  borderRadius: '0.375rem',
                  '&:hover': { borderColor: 'rgba(2,132,199,0.5)' },
                }),
                menu: (base) => ({
                  ...base,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(2,132,199,0.2)',
                  borderRadius: '0.375rem',
                }),
              }}
            />
          </div>

          <div className="mb-6 mobile:mb-4">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-sm font-medium ${activeTab === 'current' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('current')}
              >
                Current Stock
              </button>
              <button
                className={`px-4 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-sm font-medium ${activeTab === 'previous' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('previous')}
              >
                Previous Stock
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4">
            {currentCards.map(s => (
              <div key={s.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col">
                  <div className="mb-3 mobile:mb-2 relative">
                    <h3 className="text-md mobile:text-md font-semibold text-gray-900 dark:text-gray-100 truncate pr-10">
                      {s.productname}
                      <span className="text-sky-500"> ({capitalize(s.brand || '')})</span>
                    </h3>

                    <div className="absolute top-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-black text-md font-bold shadow-md">
                      {s.current_cases}
                    </div>

                    <p className="text-sm mobile:text-sm text-gray-600 dark:text-gray-400">{capitalize(s.product_type)}</p>

                    <div className="flex gap-5">
                      <p className="text-sm mobile:text-sm text-sky-300">A - {s.agent_name || '-'}</p>
                    </div>
                  </div>
                  <div className="mb-4 mobile:mb-2 grid grid-cols-2 gap-2 text-xs mobile:text-[10px]">
                    <div><span className="font-medium text-sm text-gray-700 dark:text-gray-300">Per Case: {s.per_case}</span></div>
                  </div>
                  <div className="flex justify-end gap-2 mobile:gap-1 mt-4">
                    <button
                      onClick={() => openHistoryModal(s)}
                      className="flex w-20 justify-center items-center rounded-md px-2 py-1 mobile:px-1 mobile:py-0.5 text-xs mobile:text-lg font-semibold text-white shadow-sm hover:bg-indigo-700"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      History
                    </button>

                    {localStorage.getItem('userType') === 'admin' && (
                      <button
                        onClick={() => {
                          setStockToDelete(s);
                          setShowDeleteConfirmModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition shadow-sm"
                        title="Delete this stock entry and its history"
                      >
                        <FaTimes className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => openTransferModal(s)}
                      className="flex w-20 justify-center items-center rounded-md px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-yellow-600"
                      style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredStocks.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-6 mobile:mt-4">
              No {activeTab === 'current' ? 'current' : 'previous'} stocks available.
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white hover:bg-indigo-700'}`}
                style={currentPage !== 1 ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white hover:bg-indigo-700'}`}
                style={currentPage !== totalPages ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ADD PRODUCT MODAL – with IST fix */}
      <Modal
        isOpen={showAddProductModal}
        onRequestClose={() => {
          setShowAddProductModal(false);
          setSelectedProduct(null);
          setCasesAdded('');
          setAddedDate(null);
          setShowDatePicker(false);
          setError('');
        }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black dark:text-white">Add Product to Godown</h3>
            <button onClick={() => setShowAddProductModal(false)}><FaTimes /></button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Product</label>
            <Select
              value={selectedProduct}
              onChange={setSelectedProduct}
              options={productOptions}
              placeholder="Search product..."
              isSearchable
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => 'No products available'}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Cases</label>
            <input
              type="number"
              value={casesAdded}
              onChange={e => setCasesAdded(e.target.value)}
              placeholder="10"
              min="1"
              className="w-full p-2 border rounded text-black dark:text-white dark:bg-gray-700"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">Added Date</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title={addedDate ? formatIST(addedDate.toISOString()) : "Click to select date (defaults to today)"}
              >
                <FaCalendarAlt className="text-blue-600 text-2xl" />
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300">
                {addedDate ? formatIST(addedDate.toISOString()) : 'Today (default)'}
              </span>
            </div>

            {showDatePicker && (
              <div className="mt-3 z-50">
                <DatePicker
                  selected={addedDate}
                  onChange={(date) => {
                    setAddedDate(date);
                    setShowDatePicker(false);
                  }}
                  onClickOutside={() => setShowDatePicker(false)}
                  inline
                  maxDate={new Date()}
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="flex-1 py-2 border rounded text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProductToGodown}
              disabled={addingProduct || !selectedProduct || !casesAdded}
              className="flex-1 py-2 bg-green-600 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addingProduct ? <>Adding... <FaSpinner className="animate-spin" /></> : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      {/* TAKE MODAL */}
      <Modal
        isOpen={takeModalIsOpen}
        onRequestClose={() => {
          setTakeModalIsOpen(false);
          setCasesTaken('');
          setSelectedStock(null);
        }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black dark:text-white">Take Cases</h2>
            <button onClick={() => setTakeModalIsOpen(false)}><FaTimes /></button>
          </div>
          <input
            type="number"
            value={casesTaken}
            onChange={e => setCasesTaken(e.target.value)}
            className="w-full p-2 border rounded mb-4 text-black dark:text-white"
            placeholder="Cases to take"
            min="1"
            disabled={isTakingStock}
          />
          <button
            onClick={handleTakeStock}
            disabled={isTakingStock}
            className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {isTakingStock ? 'Submitting...' : 'Take'}
          </button>
        </div>
      </Modal>

      {/* ADD MODAL (existing stock add) */}
      <Modal
        isOpen={addModalIsOpen}
        onRequestClose={() => {
          setAddModalIsOpen(false);
          setCasesToAdd('');
          setSelectedStock(null);
        }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black dark:text-white">Add Cases</h2>
            <button onClick={() => setAddModalIsOpen(false)}><FaTimes /></button>
          </div>
          <input
            type="number"
            value={casesToAdd}
            onChange={e => setCasesToAdd(e.target.value)}
            className="w-full p-2 border rounded mb-4 text-black dark:text-white"
            placeholder="Cases to add"
            min="1"
          />
          <button
            onClick={handleAddStock}
            className="w-full py-2 bg-indigo-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal
        isOpen={historyModalIsOpen}
        onRequestClose={() => {
          setHistoryModalIsOpen(false);
          setStockHistory([]);
        }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black dark:text-white">
              Stock History – {selectedStock?.productname || 'Unknown Product'}
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                • {capitalize(selectedStock?.product_type || 'Unknown')}
              </span>
              <span className="text-sky-500 font-normal ml-2">
                ({capitalize(selectedStock?.brand || '')})
              </span>
            </h2>
            <button
              className="text-black dark:text-white hover:text-red-500"
              onClick={() => setHistoryModalIsOpen(false)}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">No</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Cases</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Total Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Agent Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Performed By</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-black dark:text-white uppercase tracking-wider">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stockHistory.length > 0 ? (
                  stockHistory
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((h, i) => (
                      <tr
                        key={i}
                        className={
                          h.action === 'added' 
                            ? 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40'
                            : 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/40'
                        }
                      >
                        <td className="px-4 py-2 text-sm text-black dark:text-white">{i + 1}</td>
                        <td className="px-4 py-2 text-sm text-black dark:text-white">
                          {new Date(h.date).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className={`px-4 py-2 text-sm font-bold ${
                          h.action === 'added' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                        }`}>
                          {h.action === 'added' ? 'IN' : 'OUT'}
                        </td>
                        <td className="px-4 py-2 text-sm text-black dark:text-white">
                          {h.action === 'added' ? `+${h.cases}` : `-${h.cases}`}
                        </td>
                        <td className="px-4 py-2 text-sm text-black dark:text-white">{h.per_case_total || 0}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{h.agent_name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-sky-600 font-medium">
                          {h.action === 'added' ? (h.added_by ) : h.taken_by}
                        </td>
                        <td className="px-4 py-2 text-sm text-sky-600 font-medium">
                          {h.action === 'taken' ? (h.customer_name || '-') : '-'}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {stockHistory.length > 0 && (
            <div className="mt-6 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900"></div>
                <span className="text-gray-700 dark:text-gray-300">IN (Added)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900"></div>
                <span className="text-gray-700 dark:text-gray-300">OUT (Taken)</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* DOWNLOAD MODAL */}
      <Modal
        isOpen={showDownloadModal}
        onRequestClose={() => setShowDownloadModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Download Stock History</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="all"
                checked={downloadMode === 'all'}
                onChange={e => setDownloadMode(e.target.value)}
                className="text-black dark:text-white"
              />
              <span className="text-black dark:text-white">All History</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="date"
                checked={downloadMode === 'date'}
                onChange={e => setDownloadMode(e.target.value)}
              />
              <span className="text-black dark:text-white">Specific Date</span>
            </label>
            {downloadMode === 'date' && (
              <DatePicker
                selected={selectedDate}
                onChange={d => setSelectedDate(d)}
                className="w-full p-2 border rounded dark:bg-gray-700 text-black dark:text-white"
                placeholderText="Select date"
                dateFormat="yyyy-MM-dd"
              />
            )}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="month"
                checked={downloadMode === 'month'}
                onChange={e => setDownloadMode(e.target.value)}
              />
              <span className="text-black dark:text-white">Specific Month</span>
            </label>
            {downloadMode === 'month' && (
              <DatePicker
                selected={selectedMonth}
                onChange={d => setSelectedMonth(d)}
                showMonthYearPicker
                dateFormat="MM/yyyy"
                className="w-full p-2 border rounded dark:bg-gray-700 text-black dark:text-white"
                placeholderText="Select month"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="px-4 py-2 text-black dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmDownload}
              disabled={
                isLoadingHistory ||
                (downloadMode === 'date' && !selectedDate) ||
                (downloadMode === 'month' && !selectedMonth)
              }
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50 text-white"
            >
              {isLoadingHistory ? 'Loading...' : 'Download'}
            </button>
          </div>
        </div>
      </Modal>

      {/* UNIQUE PRODUCTS MODAL */}
      <Modal
        isOpen={showUniqueProductsModal}
        onRequestClose={() => setShowUniqueProductsModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black dark:text-white">Unique Products</h3>
            <button onClick={() => setShowUniqueProductsModal(false)}>
              <FaTimes />
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">No</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {uniqueProductsData.map(p => (
                <tr key={p.no}>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{p.no}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{p.product_type}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{p.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* TOTAL CASES MODAL */}
      <Modal
        isOpen={showTotalCasesModal}
        onRequestClose={() => setShowTotalCasesModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black dark:text-white">Total Cases</h3>
            <button onClick={() => setShowTotalCasesModal(false)}>
              <FaTimes />
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Case Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {totalCasesData.map((c, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{c.productname}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-white">{c.casecount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onRequestClose={() => {
          setShowDeleteConfirmModal(false);
          setStockToDelete(null);
        }}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-red-200 dark:border-red-900/40 shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
              Clear Stock Entry
            </h3>
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setStockToDelete(null);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to <strong>permanently delete</strong> this stock entry?
            <br /><br />
            <span className="font-semibold block">
              {stockToDelete?.productname} ({capitalize(stockToDelete?.brand || '')})
            </span>
            <br />
            <span className="text-sm text-red-600 dark:text-red-400 font-medium block">
              • All associated history records will also be deleted<br />
              • This action cannot be undone
            </span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setStockToDelete(null);
              }}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStock}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-sm"
            >
              Yes, Continue
            </button>
          </div>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal
        isOpen={transferModalIsOpen}
        onRequestClose={() => {
          setTransferModalIsOpen(false);
          setTargetGodown(null);
          setCasesTransfer('');
          setTransferDate(null);
          setShowTransferDatePicker(false);
          setError('');
        }}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black/50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black dark:text-white">Transfer Stock</h3>
            <button onClick={() => setTransferModalIsOpen(false)}><FaTimes /></button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Target Godown</label>
            <Select
              value={targetGodown}
              onChange={setTargetGodown}
              options={godownOptions}
              placeholder="Select godown..."
              isSearchable
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => 'No other godowns available'}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Cases to Transfer</label>
            <input
              type="number"
              value={casesTransfer}
              onChange={e => setCasesTransfer(e.target.value)}
              placeholder="10"
              min="1"
              max={selectedStock?.current_cases}
              className="w-full p-2 border rounded text-black dark:text-white dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Max: {selectedStock?.current_cases}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-black dark:text-white">Transfer Date</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTransferDatePicker(!showTransferDatePicker)}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title={transferDate ? formatIST(transferDate.toISOString()) : "Click to select date (defaults to today)"}
              >
                <FaCalendarAlt className="text-blue-600 text-2xl" />
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300">
                {transferDate ? formatIST(transferDate.toISOString()) : 'Today (default)'}
              </span>
            </div>

            {showTransferDatePicker && (
              <div className="mt-3 z-50">
                <DatePicker
                  selected={transferDate}
                  onChange={(date) => {
                    setTransferDate(date);
                    setShowTransferDatePicker(false);
                  }}
                  onClickOutside={() => setShowTransferDatePicker(false)}
                  inline
                  maxDate={new Date()}
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setTransferModalIsOpen(false)}
              className="flex-1 py-2 border rounded text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleTransferStock}
              disabled={transferring || !targetGodown || !casesTransfer}
              className="flex-1 py-2 bg-yellow-600 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {transferring ? <>Transferring... <FaSpinner className="animate-spin" /></> : 'Transfer'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}