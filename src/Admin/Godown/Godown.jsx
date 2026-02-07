import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaSpinner, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function Godown() {
  const [godowns, setGodowns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [rows, setRows] = useState([
    { id: Date.now(), godown: null, brand: null, productType: null, product: null, cases: '', addedDate: null, showPicker: false }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [newGodownName, setNewGodownName] = useState('');

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    },
  };

  const capitalize = (str) =>
    str ? str.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

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

  const fetchGodowns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGodowns(data.map(g => ({ value: g.id, label: capitalize(g.name) })));
    } catch { setError('Failed to load godowns'); }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/brands`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBrands(data.map(b => ({ value: b.name, label: capitalize(b.name) })));
    } catch { setError('Failed to load brands'); }
  }, []);

  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllProducts(data.map(p => ({
        value: p.id,
        label: `${p.productname} (${capitalize(p.brand || '')})`,
        productname: p.productname,
        brand: p.brand,
        per_case: p.per_case,
        product_type: p.product_type,
      })));
    } catch { setError('Failed to load products'); }
  }, []);

  useEffect(() => {
    fetchGodowns();
    fetchBrands();
    fetchAllProducts();
  }, [fetchGodowns, fetchBrands, fetchAllProducts]);

  const getProductTypesForBrand = (brandValue) => {
    if (!brandValue) return [];
    const types = [...new Set(
      allProducts
        .filter(p => p.brand?.toLowerCase() === brandValue.toLowerCase())
        .map(p => p.product_type)
        .filter(Boolean)
    )];
    return types.map(t => ({ value: t, label: capitalize(t) }));
  };

  const getProductsForBrandAndType = (brandValue, typeValue) => {
    if (!brandValue || !typeValue) return [];
    return allProducts.filter(p =>
      p.brand?.toLowerCase() === brandValue.toLowerCase() &&
      p.product_type?.toLowerCase() === typeValue.toLowerCase()
    );
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now(),
      godown: null,
      brand: null,
      productType: null,
      product: null,
      cases: '',
      addedDate: null,
      showPicker: false
    }]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const togglePicker = (id) => {
    setRows(prev => prev.map(r =>
      r.id === id ? { ...r, showPicker: !r.showPicker } : { ...r, showPicker: false }
    ));
  };

  const calculateItems = (product, cases) => {
    if (!product || !cases) return 0;
    const c = parseInt(cases, 10);
    return isNaN(c) ? 0 : product.per_case * c;
  };

  const handleCreateGodown = async () => {
    if (!newGodownName.trim()) return setError('Name required');
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGodownName.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed');

      const newGodown = { value: d.id, label: capitalize(newGodownName.trim()) };
      setGodowns(prev => [...prev, newGodown]);

      setSuccess('Godown created');
      setNewGodownName('');
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleBulkAddStock = async () => {
    const username = localStorage.getItem('username') || 'Unknown';

    const validRows = rows.filter(r =>
      r.godown && r.product && r.cases && parseInt(r.cases, 10) > 0
    );
    if (validRows.length === 0) return setError('Add at least one valid row');

    setLoading(true); setError(''); setSuccess('');

    const payload = {
      allocations: validRows.map(r => ({
        godown_id: r.godown.value,
        product_type: r.product.product_type,
        productname: r.product.productname,
        brand: r.product.brand,
        per_case: r.product.per_case,
        cases_added: parseInt(r.cases, 10),
        added_by: username,
        added_date: getDateString(e.addedDate),
      })),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/bulk-allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message ?? 'Failed');
      setSuccess(`Added stock to ${validRows.length} allocation(s)!`);
      setRows([{ id: Date.now(), godown: null, brand: null, productType: null, product: null, cases: '', addedDate: null, showPicker: false }]);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const customSelectStyles = {
    control: (p, s) => ({
      ...p,
      background: styles.input.background,
      border: `1px solid ${s.isFocused ? 'rgba(59,130,246,0.8)' : styles.input.border}`,
      boxShadow: s.isFocused ? '0 0 0 1px rgba(59,130,246,0.8)' : 'none',
      backdropFilter: 'blur(10px)',
      borderRadius: '0.5rem',
      minHeight: '36px',
      fontSize: '0.875rem',
    }),
    menu: (p) => ({
      ...p,
      background: styles.input.background,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${styles.input.border}`,
      borderRadius: '0.5rem',
      marginTop: '4px',
      zIndex: 50,
    }),
    option: (p, s) => ({
      ...p,
      backgroundColor: s.isSelected ? 'rgba(2,132,199,0.2)' : s.isFocused ? 'rgba(2,132,199,0.1)' : 'transparent',
      color: s.isSelected ? '#1e40af' : 'inherit',
      fontSize: '0.875rem',
      padding: '6px 10px',
    }),
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 pt-16 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
            Godown & Stock Allocation
          </h2>

          {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-center">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-center">{success}</div>}

          <div className="space-y-8">

            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Create New Godown</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newGodownName}
                  onChange={e => setNewGodownName(e.target.value)}
                  placeholder="Enter godown name"
                  className="flex-1 px-4 py-2 rounded border text-sm text-black"
                  style={styles.input}
                  disabled={loading}
                />
                <button onClick={handleCreateGodown} disabled={loading} style={styles.button} className="px-5 py-2 rounded text-white font-medium flex items-center gap-2">
                  {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />} Save
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Add Stock Allocations</h3>

              {rows.map((row, idx) => (
                <div key={row.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 relative">

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Godown {rows.length > 1 && `#${idx + 1}`}</label>
                    <Select
                      value={row.godown}
                      onChange={val => updateRow(row.id, 'godown', val)}
                      options={godowns}
                      placeholder="Select godown..."
                      isSearchable
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <Select
                      value={row.brand}
                      onChange={val => updateRow(row.id, 'brand', val)}
                      options={brands}
                      placeholder="Select brand first..."
                      isSearchable
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Product Type</label>
                    <Select
                      value={row.productType}
                      onChange={val => updateRow(row.id, 'productType', val)}
                      options={row.brand ? getProductTypesForBrand(row.brand.value) : []}
                      placeholder={row.brand ? "Select type..." : "First select a brand"}
                      isDisabled={!row.brand}
                      isSearchable
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Product</label>
                    <Select
                      value={row.product}
                      onChange={val => updateRow(row.id, 'product', val)}
                      options={row.brand && row.productType ? getProductsForBrandAndType(row.brand.value, row.productType.value) : []}
                      placeholder={
                        !row.brand ? "Select brand first" :
                        !row.productType ? "Select type first" :
                        "Select product..."
                      }
                      isDisabled={!row.brand || !row.productType}
                      isSearchable
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Cases</label>
                      <input
                        type="number"
                        min="1"
                        value={row.cases}
                        onChange={e => updateRow(row.id, 'cases', e.target.value)}
                        className="w-full px-4 py-2 rounded border text-black"
                        style={styles.input}
                        placeholder="Enter cases"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Items</label>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400 pt-2">
                        {calculateItems(row.product, row.cases).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Calendar Icon – IST Fixed */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Added Date</label>
                    <div className="relative inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => togglePicker(row.id)}
                        className="p-2.5 bg-white dark:bg-gray-700 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        title={row.addedDate ? formatIST(row.addedDate.toISOString()) : "Select date (defaults to today)"}
                      >
                        <FaCalendarAlt className="text-blue-600 text-xl" />
                      </button>

                      {row.addedDate && (
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatIST(row.addedDate.toISOString())}
                        </span>
                      )}
                      {!row.addedDate && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Today (default)
                        </span>
                      )}

                      {row.showPicker && (
                        <div className="absolute z-50 mt-2 left-0">
                          <DatePicker
                            selected={row.addedDate}
                            onChange={(date) => {
                              updateRow(row.id, 'addedDate', date);
                              updateRow(row.id, 'showPicker', false);
                            }}
                            onClickOutside={() => updateRow(row.id, 'showPicker', false)}
                            inline
                            maxDate={new Date()}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center gap-5 items-center">
                    <button
                      onClick={addRow}
                      style={styles.button}
                      className="px-5 py-2 rounded text-white font-medium flex items-center gap-2 text-sm"
                    >
                      <FaPlus /> Add Another Row
                    </button>

                    {rows.length > 1 && (
                      <button onClick={() => removeRow(row.id)} className="px-5 py-2 rounded bg-red-500 text-white text-sm">
                        <FaTrash className="inline mr-1" /> Remove This Row
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={handleBulkAddStock}
                disabled={loading}
                style={styles.button}
                className="w-full py-4 rounded text-white text-lg font-semibold disabled:opacity-50"
              >
                {loading ? <>Processing... <FaSpinner className="inline ml-2 animate-spin" /></> : 'Add All Stock Allocations'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}