import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../../Admin/Logout';
import Select from 'react-select';
import Modal from 'react-modal';
import { API_BASE_URL } from '../../../Config';
import { 
  FaPlus, FaTrash, FaFilePdf, FaSpinner, FaDownload, FaTimes, 
  FaSearch, FaChevronDown, FaChevronUp, FaCheckCircle, FaBell 
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

export default function Booking() {
  const [godowns, setGodowns] = useState([]);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalProducts, setGlobalProducts] = useState([]);
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  const [cart, setCart] = useState([]);
  const [fromChallan, setFromChallan] = useState(false);
  const [challanId, setChallanId] = useState(null);

  const [customer, setCustomer] = useState({
    name: '', address: '', gstin: '', lr_number: '', agent_name: '',
    from: 'SIVAKASI', to: '', through: ''
  });

  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [packingPercent, setPackingPercent] = useState(3.0);
  const [taxableValue, setTaxableValue] = useState('');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGodowns, setLoadingGodowns] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(true);
  const [applyProcessingFee, setApplyProcessingFee] = useState(true);
  const [applyCGST, setApplyCGST] = useState(false);
  const [applySGST, setApplySGST] = useState(false);
  const [applyIGST, setApplyIGST] = useState(false);
  const [pendingChallans, setPendingChallans] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);

  const searchInputRef = useRef(null);

  const styles = {
    input: { background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)", borderDark: "1px solid rgba(59,130,246,0.4)" },
    button: { background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", borderDark: "1px solid rgba(147,197,253,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }
  };

  const cardClass = "bg-white dark:bg-gray-800 rounded-xl shadow-lg";
  const textClass = "text-black dark:text-white";
  const tableText = "text-black dark:text-white";

  const capitalize = (str) => str?.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
  const shortenGodownName = (name) => name?.replace(/_/g, ' ').trim().split(/\s+/).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase()).join('') || '';

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      const enriched = data.map(c => ({
        label: `${c.value.name} (${c.value.to || 'Unknown'})`,
        value: c.value
      }));
      setCustomers(enriched);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const fetchGodowns = useCallback(async () => {
    setLoadingGodowns(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/godown`);
      const data = await res.json();
      const options = data.map(g => ({ 
        value: Number(g.id), 
        label: capitalize(g.name), 
        shortName: shortenGodownName(g.name) 
      }));
      setGodowns(options);
    } catch (err) {
      setError('Failed to load godowns');
    } finally {
      setLoadingGodowns(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/challans`)
      .then(r => r.json())
      .then(data => setPendingChallans(data || []))
      .catch(() => setPendingChallans([]));
  }, [success]);

  useEffect(() => {
    fetchGodowns();
    fetchCustomers();
  }, [fetchGodowns, fetchCustomers]);

  useEffect(() => {
    if (selectedGodown) {
      setLoadingStock(true);
      fetch(`${API_BASE_URL}/api/godown/stock/${selectedGodown.value}`)
        .then(r => r.json())
        .then(data => {
          const enriched = data.map(item => ({
            ...item,
            id: Number(item.id),
            rate_per_box: parseFloat(item.rate_per_box) || 0,
            per_case: item.per_case || 1,
            current_cases: item.current_cases || 0
          }));
          setStock(enriched);
          setFilteredStock(enriched);
        })
        .catch(() => setError('Failed to load stock'))
        .finally(() => setLoadingStock(false));
    } else {
      setStock([]);
      setFilteredStock([]);
    }
  }, [selectedGodown]);

  useEffect(() => {
    if (selectedCustomer) {
      const cust = selectedCustomer.value;
      setCustomer(prev => ({
        ...prev,
        name: cust.name || '',
        address: cust.address || '',
        gstin: cust.gstin || '',
        lr_number: cust.lr_number || '',
        agent_name: cust.agent_name || '',
        from: cust.from || 'SIVAKASI',
        to: cust.to || '',
        through: cust.through || ''
      }));
    }
  }, [selectedCustomer]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setLoadingGlobalSearch(true);
        fetch(`${API_BASE_URL}/api/search/global?name=${encodeURIComponent(searchQuery)}`)
          .then(r => r.json())
          .then(data => data.map(p => ({
            ...p,
            id: Number(p.id),
            rate_per_box: parseFloat(p.rate_per_box) || 0,
            shortGodown: shortenGodownName(p.godown_name)
          })))
          .then(setGlobalProducts)
          .catch(() => setGlobalProducts([]))
          .finally(() => setLoadingGlobalSearch(false));
      } else {
        setGlobalProducts([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const addGlobalProduct = (p) => {
    if (cart.some(i => i.id === p.id)) {
      setError('Item already in cart');
      return;
    }
    setCart(prev => [...prev, {
      ...p,
      cases: 1,
      discount: 0,
      godown: p.shortGodown,
      per_case: p.per_case || 1,
      current_cases: p.current_cases || 0,
      rate_per_box: parseFloat(p.rate_per_box) || 0
    }]);
    setSearchQuery('');
    setGlobalProducts([]);
  };

  const updateCases = (idx, val) => {
    const maxCases = fromChallan ? 999999 : (cart[idx].current_cases || 999999);
    const cases = Math.max(1, Math.min(val || 1, maxCases));
    setCart(prev => prev.map((i, i2) => i2 === idx ? { ...i, cases } : i));
  };

  const updatePerCase = (idx, val) => {
    const newPer = Math.max(1, parseInt(val) || 1);
    setCart(prev => prev.map((i, i2) => i2 === idx ? { ...i, per_case: newPer } : i));
  };

  const updateRate = (idx, val) => {
    const newRate = parseFloat(val) || 0;
    setCart(prev => prev.map((i, i2) => i2 === idx ? { ...i, rate_per_box: newRate } : i));
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const calculate = () => {
    let subtotal = 0;
    let totalCases = 0;

    cart.forEach(i => {
      const cases = parseFloat(i.cases) || 0;
      const perCase = parseFloat(i.per_case) || 1;
      const rate = parseFloat(i.rate_per_box) || 0;
      const discount = parseFloat(i.discount || 0) / 100;
      const amount = cases * perCase * rate * (1 - discount);
      subtotal += amount;
      totalCases += cases;
    });

    const packing = applyProcessingFee ? subtotal * (parseFloat(packingPercent) || 3) / 100 : 0;
    const extraTaxableAmt = parseFloat(taxableValue) || 0;
    const taxableAmount = subtotal + packing + extraTaxableAmt;
    const discountAmt = taxableAmount * (parseFloat(additionalDiscount) || 0) / 100;
    const netTaxable = taxableAmount - discountAmt;

    let cgst = 0, sgst = 0, igst = 0;
    if (applyIGST) {
      igst = netTaxable * 0.18;
    } else if (applyCGST && applySGST) {
      cgst = netTaxable * 0.09;
      sgst = netTaxable * 0.09;
    }

    const totalTax = cgst + sgst + igst;
    const grandTotal = Math.round(netTaxable + totalTax);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      packing: Number(packing.toFixed(2)),
      discountAmt: Number(discountAmt.toFixed(2)),
      taxableAmount: Number(netTaxable.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
      extraTaxable: Number(extraTaxableAmt.toFixed(2)),
      grandTotal,
      totalCases
    };
  };

  const calc = cart.length > 0 ? calculate() : {
    subtotal: 0, packing: 0, discountAmt: 0, taxableAmount: 0,
    cgst: 0, sgst: 0, igst: 0, extraTaxable: 0, grandTotal: 0, totalCases: 0
  };

  const handleLoadChallan = async (challan) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/challan/${challan.id}`);
      if (!res.ok) throw new Error('Failed to load challan');
      const fullChallan = await res.json();

      setCustomer({
        name: fullChallan.customer_name || '',
        address: fullChallan.address || '',
        gstin: fullChallan.gstin || '',
        lr_number: fullChallan.lr_number || '',
        agent_name: 'DIRECT',
        from: fullChallan.from || 'SIVAKASI',
        to: fullChallan.to || '',
        through: fullChallan.through || ''
      });

      const items = Array.isArray(fullChallan.items) ? fullChallan.items : [];

      const cartItems = items.map(item => {
        const rate = parseFloat(item.rate_per_box);
        return {
          ...item,
          id: item.id,
          productname: item.productname || '',
          brand: item.brand || '',
          cases: Number(item.cases) || 0,
          per_case: Number(item.per_case) || 1,
          rate_per_box: rate,
          discount: parseFloat(item.discount_percent || item.discount || 0), // support both names
          godown: item.godown || fullChallan.from || 'SIVAKASI',
          current_cases: 999999
        };
      });

      setCart(cartItems);
      setFromChallan(true);
      setChallanId(challan.id);

      const matchedGodown = godowns.find(g => 
        fullChallan.from?.toLowerCase().includes(g.label.toLowerCase()) ||
        g.label.toLowerCase().includes(fullChallan.from?.toLowerCase())
      );
      if (matchedGodown) setSelectedGodown(matchedGodown);

      setSuccess(`Challan ${challan.challan_number} loaded successfully!`);
      setShowPendingDropdown(false);

      console.table(
        cartItems.map(i => ({
          product: i.productname.slice(0, 30),
          cases: i.cases,
          per_case: i.per_case,
          rate: i.rate_per_box,
          qty: i.cases * i.per_case,
          amount: (i.cases * i.per_case * i.rate_per_box).toFixed(0)
        }))
      );
    } catch (err) {
      console.error('Error loading challan:', err);
      setError(err.message || 'Failed to load challan');
    }
  };

  const submitBooking = async () => {
    if (!customer.name.trim() || cart.length === 0 || !customer.to.trim() || !customer.through.trim()) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    const username = localStorage.getItem('username') || 'Unknown';

    try {
      const payload = {
        customer_name: customer.name.trim(),
        address: customer.address.trim(),
        gstin: customer.gstin.trim(),
        lr_number: customer.lr_number.trim(),
        agent_name: customer.agent_name.trim() || 'DIRECT',
        from: customer.from.trim() || 'SIVAKASI',
        to: customer.to.trim(),
        through: customer.through.trim(),
        additional_discount: parseFloat(additionalDiscount) || 0,
        packing_percent: parseFloat(packingPercent) || 3.0,
        taxable_value: taxableValue ? parseFloat(taxableValue) : null,
        stock_from: selectedGodown?.shortName || customer.from || 'SIVAKASI',
        apply_processing_fee: applyProcessingFee,
        apply_cgst: applyCGST,
        apply_sgst: applySGST,
        apply_igst: applyIGST,
        from_challan: fromChallan,
        challan_id: challanId,
        is_direct_bill: !fromChallan,
        performed_by: username,
        items: cart.map(i => ({
          id: Number(i.id),
          productname: i.productname?.trim() || '',
          brand: i.brand?.trim() || '',
          cases: Number(i.cases) || 1,
          per_case: Number(i.per_case) || 1,
          discount_percent: parseFloat(i.discount) || 0, // ← fixed: use correct field name
          godown: i.godown?.trim() || 'SIVAKASI',
          rate_per_box: parseFloat(i.rate_per_box) || 0
        }))
      };

      console.log('Sending payload to server:', JSON.stringify(payload, null, 2));

      const endpoint = `${API_BASE_URL}/api/booking`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('Server response:', data);

      if (!res.ok) {
        throw new Error(data.message || `Server error: ${res.status}`);
      }

      setSuccess(`Bill ${data.bill_number || 'Unknown'} created successfully!`);

      if (data.pdfBase64) {
        setPdfBlobUrl(data.pdfBase64);
        setBillNumber(data.bill_number || 'Unknown');
        setShowPDFModal(true);
      } else {
        setError(
          'Bill created and saved successfully, but PDF generation failed on the server. ' +
          'Please check server logs for PDF errors. The bill data is saved and can be viewed in the admin panel.'
        );
      }

      setCart([]);
      setCustomer({ name: '', address: '', gstin: '', lr_number: '', agent_name: '', from: 'SIVAKASI', to: '', through: '' });
      setSelectedCustomer(null);
      setAdditionalDiscount(0);
      setTaxableValue('');
      setFromChallan(false);
      setChallanId(null);

    } catch (err) {
      console.error('Submit Error:', err);
      setError(err.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <Sidebar />
      <Logout />

      {pendingChallans.length > 0 && (
        <div className="fixed top-20 right-4 z-40">
          <div className="relative">
            <button onClick={() => setShowPendingDropdown(!showPendingDropdown)}
              className="relative bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-4 rounded-full shadow-2xl hover:shadow-yellow-500/50 transition transform hover:scale-110">
              <FaBell className="text-2xl" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {pendingChallans.length}
              </span>
            </button>

            {showPendingDropdown && (
              <div className="absolute right-0 mt-3 w-96 mobile:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold text-lg">
                  Pending Challans ({pendingChallans.length})
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {pendingChallans.map(ch => (
                    <div key={ch.id} className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{ch.challan_number}</p>
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                              {ch.created_by || 'Admin'}
                            </span>
                          </div>
                          <p className="font-medium">{ch.customer_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            To: <strong>{ch.to}</strong> • {new Date(ch.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <button onClick={() => handleLoadChallan(ch)}
                          className="ml-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                          Generate Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowPendingDropdown(false)}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 p-4 pt-20 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">

          <h2 className="text-3xl font-bold text-center">
            Create Bill
            {fromChallan && (
              <span className="block text-lg text-green-600 font-bold mt-2">
                From Pending Challan (Stock Check Bypassed)
              </span>
            )}
          </h2>

          {error && <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-500 rounded-xl text-red-700 dark:text-red-300 text-center font-medium">{error}</div>}
          {success && <div className="p-4 bg-green-100 dark:bg-green-900/50 border border-green-500 rounded-xl text-green-700 dark:text-green-300 text-center font-medium flex items-center justify-center gap-2">
            <FaCheckCircle /> {success}
          </div>}

          <div className="space-y-8">

            <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
              <label className="block font-medium mb-1 text-black dark:text-white text-xs mobile:text-sm">Select Existing Customer (optional)</label>
              {loadingCustomers ? (
                <div className="flex items-center justify-center py-2"><FaSpinner className="animate-spin h-4 w-4 text-blue-600 mr-2" /><span className="text-xs">Loading...</span></div>
              ) : (
                <Select
                  options={customers}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="Search / Select Customer"
                  isClearable
                  className="text-xs mobile:text-sm text-black"
                  styles={{ control: (base) => ({ ...base, ...styles.input, border: '1px solid rgba(2,132,199,0.3)', boxShadow: 'none', '&:hover': { borderColor: 'rgba(2,132,199,0.5)' } }) }}
                />
              )}
            </div>

            <div className={cardClass}>
              <button onClick={() => setIsCustomerDetailsOpen(!isCustomerDetailsOpen)} className="w-full p-6 flex justify-between items-center text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                Customer Details {isCustomerDetailsOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {isCustomerDetailsOpen && (
                <div className="p-6 grid grid-cols-2 gap-6">
                  <FloatingLabelInput placeholder="Party Name *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                  <FloatingLabelInput placeholder="Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                  <FloatingLabelInput placeholder="GSTIN" value={customer.gstin} onChange={e => setCustomer({...customer, gstin: e.target.value})} />
                  <FloatingLabelInput placeholder="L.R. Number" value={customer.lr_number} onChange={e => setCustomer({...customer, lr_number: e.target.value})} />
                  <FloatingLabelInput placeholder="Agent Name" value={customer.agent_name} onChange={e => setCustomer({...customer, agent_name: e.target.value})} />
                  <FloatingLabelInput placeholder="From" value={customer.from} onChange={e => setCustomer({...customer, from: e.target.value})} />
                  <FloatingLabelInput placeholder="To *" value={customer.to} onChange={e => setCustomer({...customer, to: e.target.value})} />
                  <FloatingLabelInput placeholder="Through *" value={customer.through} onChange={e => setCustomer({...customer, through: e.target.value})} />
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className={`${cardClass} p-8`}>
                <h3 className={`text-xl font-bold mb-6 ${textClass}`}>Cart Items ({cart.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className={`p-3 border ${tableText}`}>S.No</th>
                        <th className={`p-3 border ${tableText}`}>Product</th>
                        <th className={`p-3 border ${tableText}`}>Cases</th>
                        <th className={`p-3 border ${tableText}`}>Per</th>
                        <th className={`p-3 border ${tableText}`}>Qty</th>
                        <th className={`p-3 border ${tableText}`}>Rate (₹)</th>
                        <th className={`p-3 border ${tableText}`}>Amount</th>
                        <th className={`p-3 border ${tableText}`}>From</th>
                        <th className={`p-3 border ${tableText}`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => {
                        const qty = item.cases * item.per_case;
                        const amountBefore = qty * item.rate_per_box;
                        const discountAmt = amountBefore * (item.discount / 100);
                        const finalAmt = amountBefore - discountAmt;
                        return (
                          <tr key={idx} className="border dark:border-gray-700">
                            <td className={`p-3 text-center border ${tableText}`}>{idx + 1}</td>
                            <td className={`p-3 text-center border ${tableText}`}>{item.productname}</td>
                            <td className="p-3 text-center border">
                              <input 
                                type="number" 
                                min="1" 
                                max={item.current_cases || 999999} 
                                value={item.cases} 
                                onChange={e => updateCases(idx, parseInt(e.target.value) || 1)} 
                                className="w-20 p-2 border rounded dark:bg-gray-700 hundred:text-md mobile:text-sm" 
                              />
                            </td>
                            <td className="p-3 text-center border">{item.per_case}</td>
                            <td className={`p-3 text-center border ${tableText}`}>{qty}</td>
                            <td className="p-3 text-center border">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.rate_per_box}
                                onChange={e => updateRate(idx, e.target.value)}
                                onFocus={e => e.target.select()}
                                className="w-28 p-1.5 text-center border rounded bg-white dark:bg-gray-700 
                                          text-black dark:text-white hundred:text-sm mobile:text-xs 
                                          focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className={`p-3 text-center border font-medium ${tableText}`}>₹{finalAmt.toFixed(2)}</td>
                            <td className={`p-3 text-center border ${tableText}`}>{item.godown}</td>
                            <td className="p-3 text-center border">
                              <button onClick={() => removeFromCart(idx)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 grid md:grid-cols-2 gap-8 text-lg font-medium">
                  <div>
                    <p className="text-xl font-bold">Total Cases: {calc.totalCases}</p>
                    <p>From: {customer.from}</p>
                    <p>To: {customer.to}</p>
                    <p>Through: {customer.through}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p>Goods Value : <span className="float-right ml-2">₹{calc.subtotal}</span></p>
                    {applyProcessingFee && <p>Packing @ {packingPercent}% : <span className="float-right ml-2">₹{calc.packing}</span></p>}
                    {parseFloat(taxableValue) > 0 && <p className="text-blue-600 font-bold ml-2">Extra Taxable Amount :<span className="float-right">₹{calc.extraTaxable}</span></p>}
                    {parseFloat(calc.discountAmt) > 0 && <p>Special Discount : <span className="float-right text-red-600 ml-2">-₹{calc.discountAmt}</span></p>}
                    {applyCGST && <p>CGST @ 9% : <span className="float-right ml-2">₹{calc.cgst}</span></p>}
                    {applySGST && <p>SGST @ 9% : <span className="float-right ml-2">₹{calc.sgst}</span></p>}
                    {applyIGST && <p>IGST @ 18% : <span className="float-right ml-2">₹{calc.igst}</span></p>}
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-4">
                      NET AMOUNT : <span className="float-right ml-2">₹{calc.grandTotal}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-row gap-6">
                  <div>
                    <label className={`block font-medium mb-2 ${textClass}`}>Additional Discount (%)</label>
                    <FloatingLabelInput type="number" value={additionalDiscount} onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={`flex items-center gap-3 font-medium ${textClass}`}>
                      <input type="checkbox" checked={applyProcessingFee} onChange={e => setApplyProcessingFee(e.target.checked)} className="w-5 h-5" />
                      Packing @ {packingPercent}%
                    </label>
                    <FloatingLabelInput type="number" step="0.1" value={packingPercent} onChange={e => setPackingPercent(parseFloat(e.target.value) || 0)} disabled={!applyProcessingFee} className="mt-2" />
                  </div>
                  <div>
                    <label className={`block font-medium mb-2 ${textClass}`}>Extra Taxable Amount</label>
                    <FloatingLabelInput type="number" placeholder="e.g. 1000" value={taxableValue} onChange={e => setTaxableValue(e.target.value)} />
                  </div>
                </div>

                <div className="mt-8">
                  <p className={`font-bold text-lg mb-4 ${textClass}`}>Select GST Type</p>
                  <div className="grid grid-cols-2 gap-6">
                    <button type="button" onClick={() => { if (applyCGST && applySGST) { setApplyCGST(false); setApplySGST(false); } else { setApplyCGST(true); setApplySGST(true); setApplyIGST(false); } }} className={`p-8 rounded-2xl border-2 text-left transition-all transform hover:scale-105 shadow-lg relative overflow-hidden ${(applyCGST && applySGST) ? 'border-green-500 bg-green-50 dark:bg-green-900/50 ring-4 ring-green-300 dark:ring-green-600' : 'border-gray-300 dark:border-gray-600 hover:border-green-400 bg-white dark:bg-gray-800'}`}>
                      <div className="flex items-center justify-between">
                        <div><h4 className={`font-bold hundred:text-xl mobile:text-md ${textClass}`}>Tamil Nadu</h4></div>
                        <div className={`w-10 h-10 hundred:block tab:block mobile:hidden rounded-full border-4 flex items-center justify-center transition-all ${(applyCGST && applySGST) ? 'bg-green-500 border-green-500' : 'border-gray-400 bg-transparent'}`}>
                          {(applyCGST && applySGST) && <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    </button>

                    <button type="button" onClick={() => { if (applyIGST) { setApplyIGST(false); } else { setApplyIGST(true); setApplyCGST(false); setApplySGST(false); } }} className={`p-8 rounded-2xl border-2 text-left transition-all transform hover:scale-105 shadow-lg relative overflow-hidden ${applyIGST ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 ring-4 ring-blue-300 dark:ring-blue-600' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 bg-white dark:bg-gray-800'}`}>
                      <div className="flex items-center justify-between">
                        <div><h4 className={`font-bold hundred:text-xl mobile:text-md ${textClass}`}>Other State</h4></div>
                        <div className={`w-10 h-10 hundred:block tab:block mobile:hidden rounded-full border-4 flex items-center justify-center transition-all ${applyIGST ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-transparent'}`}>
                          {applyIGST && <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center font-medium">
                    {applyCGST && applySGST ? (
                      <p className="text-green-600 dark:text-green-400 text-lg">Applied: CGST 9% + SGST 9% (Tamil Nadu)</p>
                    ) : applyIGST ? (
                      <p className="text-blue-600 dark:text-blue-400 text-lg">Applied: IGST 18% (Other States)</p>
                    ) : (
                      <p className="text-orange-600 dark:text-orange-400 text-lg">No GST Selected</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <label className="block font-bold mb-3 text-black dark:text-white text-lg">Search Products (All Godowns)</label>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl" />
                <FloatingLabelInput
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type product name (min 2 chars)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-4 text-lg"
                />
              </div>
              {loadingGlobalSearch && <div className="mt-4 text-blue-600 font-medium">Searching...</div>}
              {globalProducts.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto border-2 rounded-xl bg-gray-50 dark:bg-gray-700 p-4">
                  {globalProducts.map((p, idx) => (
                    <div key={p.id} onClick={() => addGlobalProduct(p)} className="p-4 border-b last:border-b-0 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-lg">{p.productname}</span> <span className="text-gray-500">({p.shortGodown})</span>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600 font-bold text-xl">₹{p.rate_per_box.toFixed(2)}/box</p>
                          <p className="text-sm">Cases: {p.current_cases}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <label className="block font-bold mb-3 text-black dark:text-white text-lg">
                Selected Godown: <span className="text-blue-600">{selectedGodown ? selectedGodown.label : 'None'}</span>
              </label>
              {loadingGodowns ? (
                <div className="flex items-center gap-3 text-lg"><FaSpinner className="animate-spin" /> Loading godowns...</div>
              ) : (
                <Select
                  options={godowns}
                  value={selectedGodown}
                  onChange={setSelectedGodown}
                  placeholder="Choose Godown"
                  isClearable
                  className="text-black"
                />
              )}
            </div>

            {selectedGodown && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-black dark:text-white">Available Stock in {selectedGodown.label}</h3>
                {loadingStock ? (
                  <div className="text-center py-16"><FaSpinner className="animate-spin text-5xl text-blue-600" /></div>
                ) : filteredStock.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredStock.map(item => (
                      <div key={item.id} className="border-2 rounded-xl p-6 bg-gray-50 dark:bg-gray-700 hover:shadow-2xl transition">
                        <p className="font-bold text-lg truncate">{item.productname}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cases: {item.current_cases}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Per Case: {item.per_case}</p>
                        <p className="text-green-600 font-bold text-2xl mt-3">₹{item.rate_per_box.toFixed(2)}</p>
                        <button
                          onClick={() => {
                            if (cart.some(i => i.id === item.id)) return setError('Already in cart');
                            setCart(prev => [...prev, { 
                              ...item, 
                              cases: 1, 
                              discount: 0, 
                              godown: selectedGodown.shortName,
                              rate_per_box: parseFloat(item.rate_per_box) || 0 
                            }]);
                          }}
                          disabled={item.current_cases <= 0}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl px-6 py-3 w-full text-md transition flex items-center justify-center gap-2"
                        >
                          <FaPlus /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-16 text-xl">No stock available in this godown.</p>
                )}
              </div>
            )}

            <div className='flex justify-center'>
              <button
                onClick={submitBooking}
                disabled={loading || cart.length === 0}
                className={`w-50 py-5 text-xl font-bold rounded-xl shadow-lg transition-all bg-gradient-to-r bg-green-500 text-white disabled:opacity-50`}
              >
                {loading ? (
                  <>Generating... <FaSpinner className="inline ml-3 animate-spin" /></>
                ) : (
                  <>Generate Bill <FaFilePdf className="inline ml-3" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Modal isOpen={showPDFModal} onRequestClose={() => setShowPDFModal(false)} className="bg-white dark:bg-gray-800 rounded-2xl shadow-4xl max-w-5xl h-[80%] w-full mx-4 my-8 outline-none overflow-hidden" overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="flex flex-col h-full max-h-screen">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Bill: {billNumber}</h2>
            <div className="flex gap-4">
              <a href={pdfBlobUrl} download={`${billNumber}.pdf`} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg flex items-center gap-3 font-bold text-md">
                <FaDownload /> Download
              </a>
              <button onClick={() => setShowPDFModal(false)} className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg flex items-center gap-3 font-bold text-md">
                <FaTimes /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4">
            <embed src={pdfBlobUrl} type="application/pdf" className="w-full h-full rounded" />
          </div>
        </div>
      </Modal>
    </div>
  );
}