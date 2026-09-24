import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';

Modal.setAppElement('#root');

/* ─── Shared modal style (matches GodownDetail) ─── */
const modalStyle = (maxWidth = '480px') => ({
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  content: { position: 'relative', inset: 'unset', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'auto', padding: 0 }
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

/* ─── Floating label input (dark themed) ─── */
const FloatingLabelInput = ({ value, onChange, placeholder, type = 'text', className = '', ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const isActive = isFocused || (value !== undefined && value !== null && value.toString().length > 0);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=" "
        className={`w-full px-4 py-3 rounded-lg border bg-[#1e2330] text-white text-sm placeholder-transparent outline-none transition-all
          ${isActive ? 'border-[#3fedd8] ring-2 ring-[#3fedd8]/20' : 'border-white/15 hover:border-white/25'}`}
        {...props}
      />
      <label
        onClick={() => inputRef.current?.focus()}
        className={`absolute left-4 transition-all duration-200 pointer-events-none cursor-text
          ${isActive
            ? '-top-2.5 text-[10px] font-semibold text-[#3fedd8] bg-[#1e2330] px-1.5'
            : 'top-3 text-sm text-white/35'
          }`}
      >
        {placeholder}
      </label>
    </div>
  );
};

const formatDisplay = str => str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

export default function Inventory() {
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [newProductType, setNewProductType] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [form, setForm] = useState({ productName: '', price: '', perCase: '' });
  const [brandSearch, setBrandSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState({ id: '', name: '', agent_name: '' });
  const [isBrandSectionOpen, setIsBrandSectionOpen] = useState(false);
  const [isTypeSectionOpen, setIsTypeSectionOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [editTypeModalOpen, setEditTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState({ oldName: '', newName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const brandsPerPage = 10;
  const typesPerPage = 12;
  const [currentTypePage, setCurrentTypePage] = useState(1);

  const fetchData = async () => {
    try {
      const [typeRes, brandRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/product-types`),
        fetch(`${API_BASE_URL}/api/brands`),
      ]);
      const types = await typeRes.json();
      const brandData = await brandRes.json();
      setProductTypes(types.map(t => t.product_type).filter(Boolean));
      setBrands(brandData.map(b => ({ id: b.id, name: b.name, agent_name: b.agent_name || '' })));
    } catch { setError('Failed to load data'); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 180000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear messages
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 4000); return () => clearTimeout(t); } }, [error]);

  const handleCreateProductType = async () => {
    if (!newProductType.trim()) return setError('Product type required');
    const formatted = newProductType.toLowerCase().trim().replace(/\s+/g, '_');
    if (productTypes.includes(formatted)) return setError('Already exists');
    try {
      await fetch(`${API_BASE_URL}/api/product-types`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_type: formatted }) });
      setNewProductType(''); setSuccess('Product type created!'); setIsTypeSectionOpen(false); fetchData();
    } catch { setError('Failed to create type'); }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.trim()) return setError('Brand name required');
    const formatted = newBrand.toLowerCase().trim().replace(/\s+/g, '_');
    if (brands.some(b => b.name === formatted)) return setError('Brand exists');
    try {
      await fetch(`${API_BASE_URL}/api/brands`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand: formatted, agent_name: newAgentName.trim() || null }) });
      setNewBrand(''); setNewAgentName(''); setSuccess('Brand created!'); setIsBrandSectionOpen(false); fetchData();
    } catch { setError('Failed to create brand'); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedBrand || !selectedType || !form.productName || !form.price || !form.perCase) return setError('All fields are required');
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productname: form.productName.trim(), product_type: selectedType, price: parseFloat(form.price), per_case: parseInt(form.perCase), brand: selectedBrand }),
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess('Product saved!'); setForm({ productName: '', price: '', perCase: '' }); setSelectedType('');
    } catch { setError('Failed to save product'); }
  };

  const handleUpdateBrand = async () => {
    const formatted = editingBrand.name.toLowerCase().trim().replace(/\s+/g, '_');
    try {
      await fetch(`${API_BASE_URL}/api/brands/${editingBrand.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand: formatted, agent_name: editingBrand.agent_name || null }) });
      setEditModalOpen(false); setSuccess('Brand updated'); fetchData();
    } catch { setError('Update failed'); }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand and all products?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/brands/${id}`, { method: 'DELETE' });
      setSuccess('Brand deleted'); fetchData();
    } catch { setError('Delete failed'); }
  };

  const handleUpdateProductType = async () => {
    const newRaw = editingType.newName.trim();
    if (!newRaw) return setError('Name cannot be empty');
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${editingType.oldName}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_type: newRaw }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Update failed'); }
      setSuccess('Product type updated'); setEditTypeModalOpen(false); fetchData();
    } catch (err) { setError(err.message || 'Failed to update'); }
  };

  const handleDeleteProductType = async (type) => {
    if (!window.confirm(`Delete product type "${formatDisplay(type)}" and ALL products inside it?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${type}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSuccess(`"${formatDisplay(type)}" deleted`); fetchData();
    } catch { setError('Failed to delete product type'); }
  };

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    (b.agent_name && b.agent_name.toLowerCase().includes(brandSearch.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
  const paginated = filteredBrands.slice((currentPage - 1) * brandsPerPage, currentPage * brandsPerPage);

  const filteredTypes = productTypes.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));
  const totalTypePages = Math.ceil(filteredTypes.length / typesPerPage);
  const paginatedTypes = filteredTypes.slice((currentTypePage - 1) * typesPerPage, currentTypePage * typesPerPage);

  /* ─── Pagination component ─── */
  const Pagination = ({ current, total, onPrev, onNext }) => total <= 1 ? null : (
    <div className="flex justify-center items-center gap-3 mt-4">
      <button onClick={onPrev} disabled={current === 1}
        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition">
        ← Prev
      </button>
      <span className="text-sm text-white/40">Page {current} of {total}</span>
      <button onClick={onNext} disabled={current === total}
        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition">
        Next →
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-20 overflow-auto pb-10">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-0.5">Admin</p>
            <h1 className="text-2xl font-black text-white">Inventory Management</h1>
          </div>

          {/* Messages */}
          {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm">{error}</div>}
          {success && <div className="mb-4 p-4 bg-[#3fedd8]/10 border border-[#3fedd8]/25 rounded-xl text-[#3fedd8] text-sm">{success}</div>}

          {/* Add Brand + Add Product Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Add Brand */}
            <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsBrandSectionOpen(p => !p)}
                className="w-full px-5 py-4 flex justify-between items-center text-left font-bold text-sm text-white hover:bg-white/[0.03] transition"
              >
                <span className="flex items-center gap-2">
                  <FaPlus className="text-[#3fedd8] text-xs" /> Add New Brand
                </span>
                {isBrandSectionOpen ? <FaChevronUp className="text-white/40 text-xs" /> : <FaChevronDown className="text-white/40 text-xs" />}
              </button>
              {isBrandSectionOpen && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/8">
                  <div className="pt-4 space-y-3">
                    <FloatingLabelInput value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Brand name" />
                    <FloatingLabelInput value={newAgentName} onChange={e => setNewAgentName(e.target.value)} placeholder="Agent name (optional)" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setIsBrandSectionOpen(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/60 text-sm hover:bg-white/6 transition">Cancel</button>
                    <button onClick={handleCreateBrand} className="flex-1 py-2.5 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black hover:opacity-88 transition">Save Brand</button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Product Type */}
            <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsTypeSectionOpen(p => !p)}
                className="w-full px-5 py-4 flex justify-between items-center text-left font-bold text-sm text-white hover:bg-white/[0.03] transition"
              >
                <span className="flex items-center gap-2">
                  <FaPlus className="text-[#3fedd8] text-xs" /> Add Product Type
                </span>
                {isTypeSectionOpen ? <FaChevronUp className="text-white/40 text-xs" /> : <FaChevronDown className="text-white/40 text-xs" />}
              </button>
              {isTypeSectionOpen && (
                <div className="px-5 pb-5 border-t border-white/8">
                  <div className="pt-4 space-y-3">
                    <FloatingLabelInput value={newProductType} onChange={e => setNewProductType(e.target.value)} placeholder="e.g. multi_shot, fancy, single_shot" />
                    <div className="flex gap-3">
                      <button onClick={() => setIsTypeSectionOpen(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/60 text-sm hover:bg-white/6 transition">Cancel</button>
                      <button onClick={handleCreateProductType} className="flex-1 py-2.5 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black hover:opacity-88 transition">Add Type</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 1: Select Brand */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 mb-4">
            <label className="text-xs uppercase tracking-widest text-white/40 block mb-3">Step 1 — Select Brand</label>
            <select
              value={selectedBrand}
              onChange={e => { setSelectedBrand(e.target.value); setSelectedType(''); setForm({ productName: '', price: '', perCase: '' }); }}
              className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 transition-all appearance-none"
            >
              <option value="" className="bg-[#1e2330]">Choose a brand...</option>
              {brands.map(b => (
                <option key={b.id} value={b.name} className="bg-[#1e2330]">
                  {formatDisplay(b.name)}{b.agent_name ? ` (${b.agent_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Type */}
          {selectedBrand && (
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 mb-4">
              <label className="text-xs uppercase tracking-widest text-white/40 block mb-3">Step 2 — Select Product Type</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 transition-all appearance-none"
              >
                <option value="" className="bg-[#1e2330]">Choose type...</option>
                {productTypes.map(t => <option key={t} value={t} className="bg-[#1e2330]">{formatDisplay(t)}</option>)}
              </select>
            </div>
          )}

          {/* Step 3: Add Product */}
          {selectedBrand && selectedType && (
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 mb-6">
              <label className="text-xs uppercase tracking-widest text-white/40 block mb-1">Step 3 — Add Product</label>
              <p className="text-white font-bold text-sm mb-4">{formatDisplay(selectedType)} · <span className="text-sky-400">{formatDisplay(selectedBrand)}</span></p>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="Product Name (e.g. 30 SHOT)" required />
                <FloatingLabelInput type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price per Box (₹)" min="0" step="0.01" required />
                <FloatingLabelInput type="number" value={form.perCase} onChange={e => setForm({ ...form, perCase: e.target.value })} placeholder="Qty per Case" min="1" required />
                <div className="md:col-span-2">
                  <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-black transition">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* All Brands + All Product Types */}
          <div className="grid mobile:grid-cols-1 hundred:grid-cols-2 gap-5">
            {/* All Brands */}
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">All Brands</p>
              <FloatingLabelInput value={brandSearch} onChange={e => { setBrandSearch(e.target.value); setCurrentPage(1); }} placeholder="Search brand or agent..." className="mb-4" />
              <div className="space-y-2 grid hundred:grid-cols-3 mobile:grid-cols-2 gap-2">
                {paginated.map(b => (
                  <div key={b.id} className="flex justify-between items-center px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg hover:border-white/15 transition">
                    <div>
                      <p className="text-white text-sm font-semibold">{formatDisplay(b.name)}</p>
                      {b.agent_name && <p className="text-white/45 text-xs mt-0.5">A: {b.agent_name}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingBrand(b); setEditModalOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400 hover:bg-sky-400/18 transition">
                        <FaEdit className="text-[10px]" />
                      </button>
                      <button onClick={() => handleDeleteBrand(b.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-400/10 border border-red-400/18 text-red-400 hover:bg-red-400/18 transition">
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))}
                {paginated.length === 0 && <p className="text-center text-white/25 py-6 text-sm">No brands found</p>}
              </div>
              <Pagination current={currentPage} total={totalPages} onPrev={() => setCurrentPage(p => Math.max(1, p - 1))} onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
            </div>

            {/* All Product Types */}
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">All Product Types</p>
              <FloatingLabelInput value={typeSearch} onChange={e => { setTypeSearch(e.target.value); setCurrentTypePage(1); }} placeholder="Search product type..." className="mb-4" />
              <div className="space-y-2 grid hundred:grid-cols-3 mobile:grid-cols-2 gap-2">
                {paginatedTypes.map(type => (
                  <div key={type} className="flex justify-between items-center px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg hover:border-white/15 transition">
                    <p className="text-white text-sm font-semibold">{formatDisplay(type)}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingType({ oldName: type, newName: formatDisplay(type) }); setEditTypeModalOpen(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400 hover:bg-sky-400/18 transition">
                        <FaEdit className="text-[10px]" />
                      </button>
                      <button onClick={() => handleDeleteProductType(type)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-400/10 border border-red-400/18 text-red-400 hover:bg-red-400/18 transition">
                        <FaTrash className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))}
                {paginatedTypes.length === 0 && <p className="text-center text-white/25 py-6 text-sm">No types found</p>}
              </div>
              <Pagination current={currentTypePage} total={totalTypePages} onPrev={() => setCurrentTypePage(p => Math.max(1, p - 1))} onNext={() => setCurrentTypePage(p => Math.min(totalTypePages, p + 1))} />
            </div>
          </div>

        </div>
      </div>

      {/* ─── BRAND EDIT MODAL ─── */}
      <Modal isOpen={editModalOpen} onRequestClose={() => setEditModalOpen(false)} className="_" overlayClassName="_" style={modalStyle()}>
        <ModalHeader title="Edit Brand" onClose={() => setEditModalOpen(false)} />
        <div className="p-6 space-y-4">
          <FloatingLabelInput
            value={formatDisplay(editingBrand.name || '')}
            onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            placeholder="Brand name"
          />
          <FloatingLabelInput
            value={editingBrand.agent_name || ''}
            onChange={e => setEditingBrand({ ...editingBrand, agent_name: e.target.value })}
            placeholder="Agent name"
          />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditModalOpen(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/6 transition">Cancel</button>
            <button onClick={handleUpdateBrand} className="flex-1 py-2.5 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black hover:opacity-88 transition">Update Brand</button>
          </div>
        </div>
      </Modal>

      {/* ─── PRODUCT TYPE EDIT MODAL ─── */}
      <Modal isOpen={editTypeModalOpen} onRequestClose={() => setEditTypeModalOpen(false)} className="_" overlayClassName="_" style={modalStyle()}>
        <ModalHeader title="Edit Product Type" onClose={() => setEditTypeModalOpen(false)} />
        <div className="p-6 space-y-4">
          <FloatingLabelInput
            value={editingType.newName}
            onChange={e => setEditingType({ ...editingType, newName: e.target.value })}
            placeholder="Product type name"
          />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditTypeModalOpen(false)} className="flex-1 py-2.5 border border-white/15 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/6 transition">Cancel</button>
            <button onClick={handleUpdateProductType} className="flex-1 py-2.5 bg-[#3fedd8] text-[#0a0c10] rounded-lg text-sm font-black hover:opacity-88 transition">Update Type</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}