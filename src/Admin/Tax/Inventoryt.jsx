import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaPlus, FaTrash, FaEdit, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';

const FloatingLabelInput = ({ value, onChange, placeholder, type = "text", className = "", ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(value ? true : false)}
        className={`w-full px-6 py-4 rounded-xl border ${isFocused ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-600'}
                   bg-white dark:bg-gray-700 text-black dark:text-white text-base placeholder-transparent focus:outline-none peer ${className}`}
        placeholder=" "
        {...props}
      />
      <label
        className={`absolute left-6 transition-all duration-200 pointer-events-none
                   ${isFocused || value ? '-top-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2'
                   : 'top-4 text-base text-gray-500 dark:text-gray-400'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {placeholder}
      </label>
    </div>
  );
};

export default function Inventoryt() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    productName: '',
    brand: '',
    hsnCode: '',
    price: '',
    perCase: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_BASE_URL}/api/binvent/tproducts`);
      if (!prodRes.ok) throw new Error('Failed to fetch products');
      const prods = await prodRes.json();
      setProducts(prods);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.price || !form.perCase) {
      return setError('Product Name, Price, and Quantity per Case are required');
    }

    setLoading(true);
    const url = editingProduct
      ? `${API_BASE_URL}/api/binvent/tproducts/${editingProduct.id}`
      : `${API_BASE_URL}/api/binvent/tproducts`;

    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productname: form.productName.trim(),
          brand: form.brand.trim() || null,
          hsn_code: form.hsnCode.trim() || null,
          price: parseFloat(form.price),
          per_case: parseInt(form.perCase, 10),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Operation failed');
      }

      setForm({ productName: '', brand: '', hsnCode: '', price: '', perCase: '' });
      setEditingProduct(null);
      setSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save product');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      productName: product.productname || '',
      brand: product.brand || '',
      hsnCode: product.hsn_code || '',
      price: Number(product.rate_per_box || product.price || 0),
      perCase: product.per_case || '',
    });
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/binvent/tproducts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');

      setSuccess('Product deleted successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete product');
      setTimeout(() => setError(''), 5000);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm({ productName: '', brand: '', hsnCode: '', price: '', perCase: '' });
  };

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Safe price display function
  const formatPrice = (price) => {
    const num = Number(price || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-white">
            Tax Bill Inventory
          </h1>

          {/* Notifications */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-xl text-center">
              {success}
            </div>
          )}

          {/* Add / Edit Form */}
          <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl mb-10">
            <h2 className="text-3xl font-bold mb-8 text-center text-indigo-600 dark:text-indigo-400">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FloatingLabelInput
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="Product Name (e.g. 100 Shot Green)"
                required
              />
              <FloatingLabelInput
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Price per Case (₹)"
                step="0.01"
                min="0"
                required
              />
              <FloatingLabelInput
                type="number"
                value={form.perCase}
                onChange={(e) => setForm({ ...form, perCase: e.target.value })}
                placeholder="Quantity per Case"
                min="1"
                required
              />

              <div className="lg:col-span-3 flex justify-center gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-70 text-white font-bold text-xl rounded-xl shadow-xl transition flex items-center gap-3"
                >
                  <FaPlus />
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-12 py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xl rounded-xl shadow-xl transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Products Cards */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">
              All Products ({products.length})
            </h2>

            {loading && products.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Loading products...</p>
            ) : currentProducts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                No products yet. Add one above!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2"
                  >
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      {product.productname}
                    </h3>
                    {(product.brand || product.hsn_code) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {product.brand && <p><span className="font-medium">Brand:</span> {product.brand}</p>}
                        {product.hsn_code && <p><span className="font-medium">HSN:</span> {product.hsn_code}</p>}
                      </div>
                    )}
                    <div className="space-y-2 text-gray-700 dark:text-gray-300">
                      <p>
                        <span className="font-semibold">Price:</span>{' '}
                        ₹{formatPrice(product.rate_per_box || product.price)}
                      </p>
                      <p>
                        <span className="font-semibold">Qty/Case:</span> {product.per_case}
                      </p>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 transition"
                        title="Edit"
                      >
                        <FaEdit size={22} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 transition"
                        title="Delete"
                      >
                        <FaTrash size={22} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white transition flex items-center gap-2"
              >
                <FaChevronLeft /> Previous
              </button>

              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white transition flex items-center gap-2"
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}