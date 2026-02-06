import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const FloatingLabelInput = ({ value, onChange, placeholder, type = "text", className = "", ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const isActive = isFocused || (value !== undefined && value !== null && value.toString().length > 0);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full px-6 py-4 rounded-xl border ${isActive ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-600'} 
                   bg-white dark:bg-gray-700 text-black dark:text-white hundred:text-md mobile:text-sm 
                   placeholder-transparent focus:outline-none focus:ring-0 focus:border-indigo-500 peer ${className}`}
        placeholder=" "
        {...props}
      />
      <label
        className={`absolute left-6 transition-all duration-200 pointer-events-none
                   ${isActive
                     ? '-top-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2'
                     : 'top-4 text-base text-gray-500 dark:text-gray-400'
                   } hundred:text-md mobile:text-sm`}
        onClick={() => inputRef.current?.focus()}
      >
        {placeholder}
      </label>
    </div>
  );
};

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

  const [isTypeListOpen, setIsTypeListOpen] = useState(false);
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
        fetch(`${API_BASE_URL}/api/brands`)
      ]);
      const types = await typeRes.json();
      const brandData = await brandRes.json();
      
      setProductTypes(types.map(t => t.product_type).filter(Boolean));
      setBrands(brandData.map(b => ({ id: b.id, name: b.name, agent_name: b.agent_name || '' })));
    } catch (err) {
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 180000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProductType = async () => {
    if (!newProductType.trim()) return setError('Product type required');
    const formatted = newProductType.toLowerCase().trim().replace(/\s+/g, '_');
    if (productTypes.includes(formatted)) return setError('Already exists');

    try {
      await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formatted })
      });
      setNewProductType('');
      setSuccess('Product type created!');
      setIsTypeSectionOpen(false);
      fetchData();
    } catch (err) {
      setError('Failed to create type');
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.trim()) return setError('Brand name required');
    const formatted = newBrand.toLowerCase().trim().replace(/\s+/g, '_');
    if (brands.some(b => b.name === formatted)) return setError('Brand exists');

    try {
      await fetch(`${API_BASE_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formatted, agent_name: newAgentName.trim() || null })
      });
      setNewBrand(''); 
      setNewAgentName('');
      setSuccess('Brand created!');
      setIsBrandSectionOpen(false);
      fetchData();
    } catch (err) {
      setError('Failed to create brand');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedBrand || !selectedType || !form.productName || !form.price || !form.perCase) {
      return setError('All fields are required');
    }

    const payload = {
      productname: form.productName.trim(),
      product_type: selectedType,
      price: parseFloat(form.price),
      per_case: parseInt(form.perCase),
      brand: selectedBrand
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess('Product saved successfully!');
      setForm({ productName: '', price: '', perCase: '' });
      setSelectedType('');
    } catch (err) {
      setError('Failed to save product');
    }
  };

  const handleUpdateBrand = async () => {
    const formatted = editingBrand.name.toLowerCase().trim().replace(/\s+/g, '_');
    try {
      await fetch(`${API_BASE_URL}/api/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formatted, agent_name: editingBrand.agent_name || null })
      });
      setEditModalOpen(false);
      setSuccess('Brand updated');
      fetchData();
    } catch (err) {
      setError('Update failed');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand and all products?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/brands/${id}`, { method: 'DELETE' });
      setSuccess('Brand deleted');
      fetchData();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const handleUpdateProductType = async () => {
    const newRaw = editingType.newName.trim();
    if (!newRaw) return setError("Name cannot be empty");

    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${editingType.oldName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: newRaw })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }

      setSuccess('Product type updated');
      setEditTypeModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update');
    }
  };

  const handleDeleteProductType = async (type) => {
    if (!window.confirm(`Delete product type "${formatDisplay(type)}" and ALL products inside it?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${type}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error();
      setSuccess(`Product type "${formatDisplay(type)}" deleted`);
      fetchData();
    } catch {
      setError('Failed to delete product type');
    }
  };

  const formatDisplay = (str) => str
    ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    (b.agent_name && b.agent_name.toLowerCase().includes(brandSearch.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
  const paginated = filteredBrands.slice((currentPage - 1) * brandsPerPage, currentPage * brandsPerPage);

  const filteredTypes = productTypes.filter(t =>
    t.toLowerCase().includes(typeSearch.toLowerCase())
  );

  const totalTypePages = Math.ceil(filteredTypes.length / typesPerPage);
  const paginatedTypes = filteredTypes.slice((currentTypePage - 1) * typesPerPage, currentTypePage * typesPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 justify-center">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 mobile:p-3 pt-16 mobile:pt-14 md:p-8">
        <div className="hundred:max-w-7xl tab:max-w-7xl mx-auto">
          <h1 className="text-3xl mobile:text-2xl font-bold text-center mb-8 text-black dark:text-white">
            Inventory Management
          </h1>

          {error && <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-center font-medium text-sm mobile:text-xs">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-center font-medium text-sm mobile:text-xs">{success}</div>}

          {/* Add Brand + Add Product Type - stacked on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <button
                onClick={() => setIsBrandSectionOpen(prev => !prev)}
                className="w-full p-6 flex justify-between items-center text-left font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800 transition"
              >
                Add New Brand
                {isBrandSectionOpen ? <FaChevronUp className="text-2xl" /> : <FaChevronDown className="text-2xl" />}
              </button>

              {isBrandSectionOpen && (
                <div className="p-8 space-y-6">
                  <FloatingLabelInput value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Brand name" />
                  <FloatingLabelInput value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="Agent name (optional)" />
                  <div className='flex justify-center'>
                    <button
                      onClick={handleCreateBrand}
                      className="w-50 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold text-xl rounded-xl shadow-lg transition transform hover:scale-105"
                    >
                      Save Brand
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <button
                onClick={() => setIsTypeSectionOpen(prev => !prev)}
                className="w-full p-6 flex justify-between items-center text-left font-bold text-xl bg-gradient-to-r from-teal-600 to-cyan-700 text-white hover:from-teal-700 hover:to-cyan-800 transition"
              >
                Add Product Type
                {isTypeSectionOpen ? <FaChevronUp className="text-2xl" /> : <FaChevronDown className="text-2xl" />}
              </button>

              {isTypeSectionOpen && (
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex flex-col justify-center gap-5">
                    <FloatingLabelInput
                      value={newProductType}
                      onChange={(e) => setNewProductType(e.target.value)}
                      placeholder="e.g. multi_shot, fancy, single_shot"
                      className="flex-1"
                    />
                    <div className='flex justify-center'>
                      <button
                        onClick={handleCreateProductType}
                        className="px-8 py-4 w-50 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white font-semibold text-xl rounded-xl shadow-lg flex items-center justify-center gap-3 transition transform hover:scale-105"
                      >
                        <FaPlus className="text-2xl" /> Add Type
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Brand & Type selection - stacked */}
          <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg mb-8">
            <label className="block text-lg mobile:text-base font-bold mb-4 text-black dark:text-white">
              Step 1: Select Brand
            </label>
            <select
              value={selectedBrand}
              onChange={e => {
                setSelectedBrand(e.target.value);
                setSelectedType(''); 
                setForm({ productName: '', price: '', perCase: '' });
              }}
              className="w-full px-5 py-4 mobile:py-3 rounded-lg border-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white hundred:text-md mobile:text-sm focus:border-blue-500 outline-none"
            >
              <option value="">Choose a brand...</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>
                  {formatDisplay(b.name)} {b.agent_name && `(${b.agent_name})`}
                </option>
              ))}
            </select>
          </div>

          {selectedBrand && (
            <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg mb-8">
              <label className="block text-lg mobile:text-base font-bold mb-4 text-black dark:text-white">
                Step 2: Select Product Type
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-5 py-4 mobile:py-3 rounded-lg border-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white hundred:text-md mobile:text-sm focus:border-blue-500 outline-none"
              >
                <option value="">Choose type...</option>
                {productTypes.map(t => (
                  <option key={t} value={t}>{formatDisplay(t)}</option>
                ))}
              </select>
            </div>
          )}

          {selectedBrand && selectedType && (
            <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg mb-10">
              <h3 className="text-xl mobile:text-lg font-bold mb-6 text-blue-600 dark:text-blue-400">
                Add Product → {formatDisplay(selectedType)} ({formatDisplay(selectedBrand)})
              </h3>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 mobile:grid-cols-1 md:grid-cols-2 gap-6 mobile:gap-5">
                <FloatingLabelInput
                  value={form.productName}
                  onChange={e => setForm({ ...form, productName: e.target.value })}
                  placeholder="Product Name * (e.g. 30 SHOT)"
                  required
                />
                <FloatingLabelInput
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="Price per Box (₹) *"
                  min="0"
                  step="0.01"
                  required
                />
                <FloatingLabelInput
                  type="number"
                  value={form.perCase}
                  onChange={e => setForm({ ...form, perCase: e.target.value })}
                  placeholder="Qty per Case *"
                  min="1"
                  required
                />
                <div className="md:col-span-2 flex justify-center gap-4">
                  <button type="submit" className="px-8 py-4 w-50 flex justify-center mobile:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg mobile:text-base transition">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ────────────────────────────────────────────────
              All Brands + All Product Types → two columns on desktop
          ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 hundred:grid-cols-2 gap-8">
            {/* All Brands */}
            <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-2xl mobile:text-xl font-bold mb-6 text-black dark:text-white">All Brands</h3>
              <FloatingLabelInput
                value={brandSearch}
                onChange={e => { setBrandSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search brand or agent..."
                className="mb-6"
              />
              <div className="grid grid-cols-1 mobile:grid-cols-2  hundred:grid-cols-3 gap-5 mobile:gap-4">
                {paginated.map(b => (
                  <div key={b.id} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 p-5 mobile:p-4 rounded-xl shadow border border-blue-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-base mobile:text-sm text-black dark:text-white">{formatDisplay(b.name)}</h4>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingBrand(b); setEditModalOpen(true); }} className="text-blue-600 hover:text-blue-800">
                          <FaEdit size={18} />
                        </button>
                        <button onClick={() => handleDeleteBrand(b.id)} className="text-red-600 hover:text-red-800">
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </div>
                    {b.agent_name && <p className="text-sm mobile:text-xs text-black dark:text-white opacity-80">Agent: {b.agent_name}</p>}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-4 flex-wrap">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-5 mobile:px-4 py-2.5 mobile:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg hundred:text-md mobile:text-sm transition">
                    Previous
                  </button>
                  <span className="py-2.5 px-5 hundred:text-md mobile:text-sm font-medium text-black dark:text-white">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-5 mobile:px-4 py-2.5 mobile:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg hundred:text-md mobile:text-sm transition">
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* All Product Types */}
            <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-2xl mobile:text-xl font-bold mb-6 text-black dark:text-white">
                All Product Types
              </h3>

              <FloatingLabelInput
                value={typeSearch}
                onChange={e => {
                  setTypeSearch(e.target.value);
                  setCurrentTypePage(1);
                }}
                placeholder="Search product type..."
                className="mb-6"
              />

              <div className="grid grid-cols-1 mobile:grid-cols-2 hundred:grid-cols-3 gap-4">
                {paginatedTypes.map(type => (
                  <div
                    key={type}
                    className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-700 dark:to-gray-800 p-5 rounded-xl shadow border border-teal-200 dark:border-gray-600 flex justify-between items-start"
                  >
                    <h4 className="font-bold text-base mobile:text-sm text-black dark:text-white">
                      {formatDisplay(type)}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingType({ oldName: type, newName: formatDisplay(type) });
                          setEditTypeModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProductType(type)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalTypePages > 1 && (
                <div className="mt-6 flex justify-center gap-4 flex-wrap">
                  <button
                    onClick={() => setCurrentTypePage(p => Math.max(1, p - 1))}
                    disabled={currentTypePage === 1}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="py-2 font-medium">
                    Page {currentTypePage} / {totalTypePages}
                  </span>
                  <button
                    onClick={() => setCurrentTypePage(p => Math.min(totalTypePages, p + 1))}
                    disabled={currentTypePage === totalTypePages}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brand Edit Modal */}
      <Modal isOpen={editModalOpen} onRequestClose={() => setEditModalOpen(false)}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 mobile:p-6 max-w-md mx-4 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <h3 className="text-2xl mobile:text-xl font-bold mb-6 text-black dark:text-white">Edit Brand</h3>
        <FloatingLabelInput
          value={formatDisplay(editingBrand.name || '')}
          onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          placeholder="Brand name"
          className="mb-4"
        />
        <FloatingLabelInput
          value={editingBrand.agent_name || ''}
          onChange={e => setEditingBrand({ ...editingBrand, agent_name: e.target.value })}
          placeholder="Agent name"
          className="mb-6"
        />
        <div className="flex justify-end gap-4 mobile:flex-col">
          <button onClick={() => setEditModalOpen(false)} className="px-6 mobile:px-5 py-3 mobile:py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition hundred:text-md mobile:text-sm">
            Cancel
          </button>
          <button onClick={handleUpdateBrand} className="px-6 mobile:px-5 py-3 mobile:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition hundred:text-md mobile:text-sm">
            Update Brand
          </button>
        </div>
      </Modal>

      {/* Product Type Edit Modal */}
      <Modal
        isOpen={editTypeModalOpen}
        onRequestClose={() => setEditTypeModalOpen(false)}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      >
        <h3 className="text-2xl font-bold mb-6 text-black dark:text-white">Edit Product Type</h3>

        <FloatingLabelInput
          value={editingType.newName}
          onChange={e => setEditingType({ ...editingType, newName: e.target.value })}
          placeholder="Product type name"
          className="mb-6"
        />

        <div className="flex justify-end gap-4">
          <button
            onClick={() => setEditTypeModalOpen(false)}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProductType}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
          >
            Update Type
          </button>
        </div>
      </Modal>
    </div>
  );
}