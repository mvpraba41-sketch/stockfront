// src/Components/Godown/List.jsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Sidebar from '../Sidebar/Sidebar';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaEdit, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Logout from '../Logout';

Modal.setAppElement('#root');

export default function List() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    productname: '',
    price: '',
    case_count: '',
    per_case: '',
    brand: '',
    product_type: '',
  });
  const productsPerPage = 9;

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  const fetchData = async (url, errorMsg, setter) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || errorMsg);
      setter(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProductTypes = () => fetchData(
    `${API_BASE_URL}/api/product-types`,
    'Failed to fetch product types',
    data => setProductTypes(data.map(item => item.product_type))
  );

  const fetchBrands = () => fetchData(
    `${API_BASE_URL}/api/brands`,
    'Failed to fetch brands',
    data => setBrands(data.map(item => item.name))
  );

  const fetchProducts = () => fetchData(
    `${API_BASE_URL}/api/products`,
    'Failed to fetch products',
    data => {
      setProducts(data);
      applyFilters(data, filterType, filterBrand);
    }
  );

  const applyFilters = (data, type, brand) => {
    let filtered = data;
    if (type !== 'all') {
      filtered = filtered.filter(p => p.product_type === type);
    }
    if (brand !== 'all') {
      filtered = filtered.filter(p => p.brand === brand);
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchProductTypes();
    fetchBrands();
    fetchProducts();
    const intervalId = setInterval(() => {
      fetchProductTypes();
      fetchBrands();
      fetchProducts();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    applyFilters(products, filterType, filterBrand);
  }, [filterType, filterBrand, products]);

  const handleSubmit = async (e, isEdit) => {
    e.preventDefault();
    if (!formData.productname || !formData.price || !formData.per_case || !formData.brand || (!isEdit && !formData.product_type)) {
      setError('Please fill in all required fields');
      return;
    }
    const url = isEdit
      ? `${API_BASE_URL}/api/products/${selectedProduct.product_type.toLowerCase().replace(/\s+/g, '_')}/${selectedProduct.id}`
      : `${API_BASE_URL}/api/products`;
    const payload = {
      productname: formData.productname,
      price: parseFloat(formData.price),
      per_case: parseInt(formData.per_case, 10),
      brand: formData.brand,
      ...(isEdit ? {} : { product_type: formData.product_type })
    };
    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'add'} product`);
      fetchProducts();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (product) => {
    try {
      await fetch(`${API_BASE_URL}/api/products/${product.product_type.toLowerCase().replace(/\s+/g, '_')}/${product.id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setEditModalIsOpen(false);
    setAddModalIsOpen(false);
    setSelectedProduct(null);
    setError('');
    setFormData({ productname: '', price: '', per_case: '', brand: '', product_type: '' });
  };

  const capitalize = str => {
    if (typeof str !== 'string' || !str) return '';
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderModalForm = (isEdit) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-4 max-w-md mobile:max-w-[90vw] w-full sm:max-w-lg">
      <h2 className="text-lg mobile:text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <div className="space-y-4 mobile:space-y-2">
        {!isEdit && (
          <div>
            <label className="block text-sm mobile:text-xs font-medium text-gray-700 dark:text-gray-300">Product Type</label>
            <input
              type="text"
              name="product_type"
              value={formData.product_type}
              onChange={e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              className="mt-1 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-black border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm mobile:text-xs"
              style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
              required
            />
          </div>
        )}
        {['productname', 'price', 'per_case'].map(field => (
          <div key={field}>
            <label className="block text-sm mobile:text-xs font-medium text-gray-700 dark:text-gray-300">{capitalize(field.replace('_', ' '))}</label>
            <input
              type={field === 'price' ? 'number' :  field === 'per_case' ? 'number' : 'text'}
              name={field}
              value={formData[field]}
              onChange={e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              className="mt-1 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-black border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm mobile:text-xs"
              style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
              required
              step={field === 'price' ? '0.01' : '1'}
              min={ field === 'per_case' ? '0' : field === 'price' ? '0' : undefined}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm mobile:text-xs font-medium text-gray-700 dark:text-gray-300">Brand</label>
          <select
            name="brand"
            value={formData.brand}
            onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            className="mt-1 mobile:mt-0.5 block w-full rounded-md bg-white dark:bg-gray-900 text-black border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-600 dark:focus:border-blue-500 focus:ring-indigo-600 dark:focus:ring-blue-500 sm:text-sm mobile:text-xs"
            style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
            required
          >
            <option value="">Select Brand</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{capitalize(brand)}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 mobile:mt-3 flex justify-end space-x-2 mobile:space-x-1">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
            style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={e => handleSubmit(e, isEdit)}
            className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
            style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );

  const { indexOfFirstProduct, indexOfLastProduct } = {
    indexOfFirstProduct: currentPage * productsPerPage - productsPerPage,
    indexOfLastProduct: currentPage * productsPerPage
  };
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 overflow-hidden justify-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl mobile:text-xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6 mobile:mb-4">List Products</h2>
          {error && <div className="mb-4 mobile:mb-2 text-red-600 dark:text-red-400 text-sm mobile:text-xs text-center">{error}</div>}
          <div className="mb-6 mobile:mb-4 flex mobile:flex-col mobile:gap-4 justify-between items-center">
            <div className="flex mobile:flex-col space-x-4 mobile:space-x-0 mobile:space-y-4">
              <div>
                <label htmlFor="product-type-filter" className="block text-sm mobile:text-xs font-medium text-gray-900 dark:text-gray-300">Filter by Product Type</label>
                <select
                  id="product-type-filter"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="mt-2 mobile:mt-1 block w-48 mobile:w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 outline-1 outline-gray-300 dark:outline-gray-600 focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm mobile:text-xs"
                  style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                >
                  <option value="all">All</option>
                  {productTypes.map(type => <option key={type} value={type}>{capitalize(type)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="brand-filter" className="block text-sm mobile:text-xs font-medium text-gray-900 dark:text-gray-300">Filter by Brand</label>
                <select
                  id="brand-filter"
                  value={filterBrand}
                  onChange={e => setFilterBrand(e.target.value)}
                  className="mt-2 mobile:mt-1 block w-48 mobile:w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-600 outline-1 outline-gray-300 dark:outline-gray-600 focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm mobile:text-xs"
                  style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                >
                  <option value="all">All</option>
                  {brands.map(brand => <option key={brand} value={brand}>{capitalize(brand)}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setAddModalIsOpen(true)}
              className="rounded-md px-3 py-2 mobile:px-2 mobile:py-1 text-sm mobile:text-xs font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600"
              style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
            >
              Add Product
            </button>
          </div>
          {currentProducts.length === 0 ? (
            <p className="text-lg mobile:text-base text-center text-gray-600 dark:text-gray-300 sm:text-xl font-medium">No products found</p>
          ) : (
            <div className="grid grid-cols-3 mobile:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-4 justify-center">
              {currentProducts.map(product => {
                const productKey = `${product.product_type}-${product.id}`;
                return (
                  <div key={productKey} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mobile:p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col">
                      <div className="mb-3 mobile:mb-2">
                        <h3 className="hundred:text-xl mobile:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{product.productname}</h3>
                        <p className="hundred:text-lg mobile:text-xs text-gray-600 dark:text-gray-400">{capitalize(product.product_type)}</p>
                        <p className="hundred:text-lg mobile:text-xs text-sky-300">B - {capitalize(product.brand)}</p>
                      </div>
                      <div className="mb-4 mobile:mb-2 grid grid-cols-2 mobile:grid-cols-1 gap-2 mobile:gap-1">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 hundred:text-md">Price: ₹{parseFloat(product.price).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Quantity / case: {product.per_case}</span>
                        </div>
                      </div>
                      <div className="flex mobile:gap-1 justify-center gap-2">
                        <button
                          onClick={() => { setSelectedProduct(product); setModalIsOpen(true); }}
                          className="flex items-center px-3 py-1 mobile:px-2 mobile:py-0.5 text-xs sm:text-sm mobile:text-[10px] text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md"
                          style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                        >
                          <FaEye className="mr-1 h-4 w-4 mobile:h-3 mobile:w-3" /> View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setFormData({
                              productname: product.productname,
                              price: product.price,
                              case_count: product.case_count,
                              per_case: product.per_case,
                              brand: product.brand,
                              product_type: product.product_type
                            });
                            setEditModalIsOpen(true);
                          }}
                          className="flex items-center px-3 py-1 mobile:px-2 mobile:py-0.5 text-xs sm:text-sm mobile:text-[10px] text-white dark:text-gray-100 hover:bg-green-700 dark:hover:bg-green-600 rounded-md"
                          style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                        >
                          <FaEdit className="mr-1 h-4 w-4 mobile:h-3 mobile:w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="flex items-center px-3 py-1 mobile:px-2 mobile:py-0.5 text-xs sm:text-sm mobile:text-[10px] text-white dark:text-gray-100 hover:bg-red-700 dark:hover:bg-red-600 rounded-md"
                          style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                        >
                          <FaTrash className="mr-1 h-4 w-4 mobile:h-3 mobile:w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-6 mobile:mt-4 flex justify-center items-center space-x-4 mobile:space-x-2">
              <button
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}
                disabled={currentPage === 1}
                className={`p-2 mobile:p-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-white dark:text-gray-100 hover:bg-indigo-700 dark:hover:bg-blue-600'}`}
                style={currentPage !== 1 ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                <FaArrowLeft className="h-5 w-5 mobile:h-4 mobile:w-4" />
              </button>
              <span className="text-sm mobile:text-xs text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}
                disabled={currentPage === totalPages}
                className={`p-2 mobile:p-1 rounded-md ${currentPage === totalPages ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-white dark:text-gray-100 hover:bg-indigo-700 dark:hover:bg-blue-600'}`}
                style={currentPage !== totalPages ? { background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow } : {}}
              >
                <FaArrowRight className="h-5 w-5 mobile:h-4 mobile:w-4" />
              </button>
            </div>
          )}
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            {selectedProduct && (
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mobile:p-4 max-w-md mobile:max-w-[90vw] w-full sm:max-w-lg">
                <h2 className="text-lg mobile:text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 mobile:mb-2 text-center">Product Details</h2>
                <div className="space-y-4 mobile:space-y-2">
                  <div className="grid grid-cols-2 mobile:grid-cols-1 gap-4 mobile:gap-2">
                    {['product_type', 'productname', 'price', 'case_count', 'per_case', 'brand'].map(field => (
                      <div key={field}>
                          <span className="font-medium text-black text-xs sm:text-sm mobile:text-[10px]">{capitalize(field.replace('_', ' '))}:</span>
                          <p className="text-sm mobile:text-xs text-black dark:text-gray-100">
                          {field === 'price' ? `₹${parseFloat(selectedProduct[field]).toFixed(2)}` : capitalize(selectedProduct[field])}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={closeModal}
                      className="rounded-md px-3 mobile:px-2 py-2 mobile:py-1 text-xs sm:text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-gray-700 dark:hover:bg-gray-600"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Modal>
          <Modal
            isOpen={editModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            {renderModalForm(true)}
          </Modal>
          <Modal
            isOpen={addModalIsOpen}
            onRequestClose={closeModal}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/70"
          >
            {renderModalForm(false)}
          </Modal>
        </div>
      </div>
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