import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaSpinner, FaTrash, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

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

/* ─── Label + Select combo ─── */
const SelectField = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-white">{label}</label>
    <Select styles={selectStyles} menuPortalTarget={document.body} menuPosition="fixed" {...props} />
  </div>
);

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

  const capitalize = (str) =>
    str ? str.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  const getDateString = (date) => {
    if (!date) return new Date().toLocaleDateString('en-CA');
    return date.toLocaleDateString('en-CA');
  };

  const formatIST = (dbDateString) => {
    if (!dbDateString) return 'Today (default)';
    return new Date(dbDateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
        value: p.id, label: `${p.productname} (${capitalize(p.brand || '')})`,
        productname: p.productname, brand: p.brand, per_case: p.per_case, product_type: p.product_type,
      })));
    } catch { setError('Failed to load products'); }
  }, []);

  useEffect(() => { fetchGodowns(); fetchBrands(); fetchAllProducts(); }, [fetchGodowns, fetchBrands, fetchAllProducts]);

  const getProductTypesForBrand = (brandValue) => {
    if (!brandValue) return [];
    const types = [...new Set(allProducts.filter(p => p.brand?.toLowerCase() === brandValue.toLowerCase()).map(p => p.product_type).filter(Boolean))];
    return types.map(t => ({ value: t, label: capitalize(t) }));
  };

  const getProductsForBrandAndType = (brandValue, typeValue) => {
    if (!brandValue || !typeValue) return [];
    return allProducts.filter(p =>
      p.brand?.toLowerCase() === brandValue.toLowerCase() &&
      p.product_type?.toLowerCase() === typeValue.toLowerCase()
    );
  };

  const addRow = () => setRows(prev => [...prev, { id: Date.now(), godown: null, brand: null, productType: null, product: null, cases: '', addedDate: null, showPicker: false }]);
  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id));
  const updateRow = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const togglePicker = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, showPicker: !r.showPicker } : { ...r, showPicker: false }));
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGodownName.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed');
      setGodowns(prev => [...prev, { value: d.id, label: capitalize(newGodownName.trim()) }]);
      setSuccess('Godown created successfully!');
      setNewGodownName('');
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleBulkAddStock = async (e) => {
    e.preventDefault();
    const username = localStorage.getItem('username') || 'Unknown';
    const validRows = rows.filter(r => r.godown && r.product && r.cases && parseInt(r.cases, 10) > 0);
    if (validRows.length === 0) return setError('Add at least one valid row');
    setLoading(true); setError(''); setSuccess('');
    const payload = {
      allocations: validRows.map(r => ({
        godown_id: r.godown.value, product_type: r.product.product_type,
        productname: r.product.productname, brand: r.product.brand,
        per_case: r.product.per_case, cases_added: parseInt(r.cases, 10),
        added_by: username, added_date: getDateString(r.addedDate),
      })),
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/godowns/bulk-allocate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message ?? 'Failed');
      setSuccess(`Added stock to ${validRows.length} allocation(s)!`);
      setRows([{ id: Date.now(), godown: null, brand: null, productType: null, product: null, cases: '', addedDate: null, showPicker: false }]);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-20 overflow-auto pb-10">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Heading */}
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">Inventory</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Godown &amp; Stock Allocation</h1>
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm">{error}</div>}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-400/25 rounded-xl text-green-300 text-sm flex items-center gap-2">
              <FaCheckCircle /> {success}
            </div>
          )}

          {/* Create new godown */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-white/45 mb-4">Create New Godown</p>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-semibold text-white">Godown Name</label>
                <input
                  type="text" value={newGodownName} onChange={e => setNewGodownName(e.target.value)}
                  placeholder="Enter godown name..." disabled={loading}
                  className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 disabled:opacity-40 transition-all"
                />
              </div>
              <div className="flex items-end">
                <button onClick={handleCreateGodown} disabled={loading}
                  className="flex items-center gap-2 bg-[#3fedd8] text-[#0a0c10] font-bold px-5 py-3 rounded-lg hover:opacity-88 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm">
                  {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />} Save
                </button>
              </div>
            </div>
          </div>

          {/* Stock allocation rows */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/45">Add Stock Allocations</p>

            {rows.map((row, idx) => (
              <div key={row.id} className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                    Row {rows.length > 1 ? idx + 1 : ''}
                  </span>
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(row.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs transition">
                      <FaTrash className="text-[10px]" /> Remove
                    </button>
                  )}
                </div>

                <SelectField
                  label="Godown" value={row.godown}
                  onChange={val => updateRow(row.id, 'godown', val)}
                  options={godowns} placeholder="Select godown..." isSearchable
                />

                <SelectField
                  label="Brand" value={row.brand}
                  onChange={val => updateRow(row.id, 'brand', val)}
                  options={brands} placeholder="Select brand..." isSearchable
                />

                <SelectField
                  label="Product Type" value={row.productType}
                  onChange={val => updateRow(row.id, 'productType', val)}
                  options={row.brand ? getProductTypesForBrand(row.brand.value) : []}
                  placeholder={row.brand ? 'Select type...' : 'Select brand first'}
                  isDisabled={!row.brand} isSearchable
                />

                <SelectField
                  label="Product" value={row.product}
                  onChange={val => updateRow(row.id, 'product', val)}
                  options={row.brand && row.productType ? getProductsForBrandAndType(row.brand.value, row.productType.value) : []}
                  placeholder={!row.brand ? 'Select brand first' : !row.productType ? 'Select type first' : 'Select product...'}
                  isDisabled={!row.brand || !row.productType} isSearchable
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-white">Cases</label>
                    <input
                      type="number" min="1" value={row.cases}
                      onChange={e => updateRow(row.id, 'cases', e.target.value)}
                      placeholder="Enter cases"
                      className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center">
                    <label className="text-sm font-semibold text-white">Total Items</label>
                    <p className="text-2xl font-black text-[#3fedd8]">
                      {calculateItems(row.product, row.cases).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Date picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-white">Added Date</label>
                  <div className="relative">
                    <button type="button" onClick={() => togglePicker(row.id)}
                      className="flex items-center gap-3 bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm hover:border-[#3fedd8] transition w-full text-left">
                      <FaCalendarAlt className="text-[#3fedd8]" />
                      <span className={row.addedDate ? 'text-white' : 'text-white/35'}>
                        {row.addedDate ? formatIST(row.addedDate.toISOString()) : 'Today (default)'}
                      </span>
                    </button>
                    {row.showPicker && (
                      <div className="absolute z-50 mt-1">
                        <DatePicker
                          selected={row.addedDate}
                          onChange={(date) => { updateRow(row.id, 'addedDate', date); updateRow(row.id, 'showPicker', false); }}
                          onClickOutside={() => updateRow(row.id, 'showPicker', false)}
                          inline maxDate={new Date()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add row */}
            <button onClick={addRow}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/15 rounded-xl py-4 text-white/45 hover:border-[#3fedd8]/30 hover:text-[#3fedd8] text-sm font-medium transition">
              <FaPlus className="text-xs" /> Add Another Row
            </button>

            {/* Submit */}
            <button onClick={handleBulkAddStock} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#3fedd8] text-[#0a0c10] font-black text-base py-4 rounded-xl hover:opacity-88 disabled:opacity-35 disabled:cursor-not-allowed transition shadow-lg shadow-[#3fedd8]/20">
              {loading ? <><FaSpinner className="animate-spin" /> Processing...</> : 'Add All Stock Allocations'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}