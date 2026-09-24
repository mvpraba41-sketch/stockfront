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

/* ─── react-select dark theme ─── */
const selectStyles = {
  control: (b, s) => ({
    ...b,
    background: '#1e2330',
    borderColor: s.isFocused ? '#3fedd8' : 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    minHeight: '46px',
    boxShadow: s.isFocused ? '0 0 0 3px rgba(63,237,216,0.15)' : 'none',
    '&:hover': { borderColor: '#3fedd8' },
  }),
  menu: (b) => ({
    ...b,
    background: '#1e2330',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    zIndex: 9999,
  }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  option: (b, s) => ({
    ...b,
    background: s.isFocused ? 'rgba(63,237,216,0.12)' : s.isSelected ? 'rgba(63,237,216,0.2)' : 'transparent',
    color: '#ffffff',
    fontSize: '0.875rem',
    cursor: 'pointer',
  }),
  singleValue: (b) => ({ ...b, color: '#ffffff', fontSize: '0.875rem' }),
  placeholder: (b) => ({ ...b, color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }),
  input: (b) => ({ ...b, color: '#ffffff' }),
  indicatorSeparator: (b) => ({ ...b, background: 'rgba(255,255,255,0.1)' }),
  dropdownIndicator: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
  clearIndicator: (b) => ({ ...b, color: 'rgba(255,255,255,0.4)' }),
};

/* ─── Helper: Current Date in Indian Timezone (YYYY-MM-DD) ─── */
const getIndianDate = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    const year = ist.getFullYear();
    const month = String(ist.getMonth() + 1).padStart(2, '0');
    const day = String(ist.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/* ─── Field: white label ABOVE input ─── */
const Field = ({ label, value, onChange, type = 'text', disabled = false, step, placeholder = '' }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-white">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      step={step}
      placeholder={placeholder}
      style={type === 'date' ? { colorScheme: 'dark' } : {}}
      className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    />
  </div>
);

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

  const [billDate, setBillDate] = useState(getIndianDate());

  const [customer, setCustomer] = useState({
    name: '', address: '', gstin: '', lr_number: '',
    agent_name: '', from: 'SIVAKASI', to: '', through: ''
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

  const capitalize = (str) =>
    str?.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
  const shortenGodownName = (name) =>
    name?.replace(/_/g, ' ').trim().split(/\s+/).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase()).join('') || '';

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data.map(c => ({
        label: `${c.value.name} (${c.value.to || 'Unknown'})`,
        value: c.value
      })));
    } catch { setError('Failed to load customers'); }
    finally { setLoadingCustomers(false); }
  }, []);

  const fetchGodowns = useCallback(async () => {
    setLoadingGodowns(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/godown`);
      const data = await res.json();
      setGodowns(data.map(g => ({
        value: Number(g.id),
        label: capitalize(g.name),
        shortName: shortenGodownName(g.name)
      })));
    } catch { setError('Failed to load godowns'); }
    finally { setLoadingGodowns(false); }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/challans`)
      .then(r => r.json()).then(d => setPendingChallans(d || [])).catch(() => setPendingChallans([]));
  }, [success]);

  useEffect(() => { fetchGodowns(); fetchCustomers(); }, [fetchGodowns, fetchCustomers]);

  useEffect(() => {
    if (!selectedGodown) { setStock([]); setFilteredStock([]); return; }
    setLoadingStock(true);
    fetch(`${API_BASE_URL}/api/godown/stock/${selectedGodown.value}`)
      .then(r => r.json())
      .then(data => {
        const enriched = data.map(item => ({
          ...item, id: Number(item.id),
          rate_per_box: parseFloat(item.rate_per_box) || 0,
          per_case: item.per_case || 1, current_cases: item.current_cases || 0
        }));
        setStock(enriched); setFilteredStock(enriched);
      })
      .catch(() => setError('Failed to load stock'))
      .finally(() => setLoadingStock(false));
  }, [selectedGodown]);

  useEffect(() => {
    if (!selectedCustomer) return;
    const c = selectedCustomer.value;
    setCustomer(p => ({
      ...p, name: c.name || '', address: c.address || '', gstin: c.gstin || '',
      lr_number: c.lr_number || '', agent_name: c.agent_name || '',
      from: c.from || 'SIVAKASI', to: c.to || '', through: c.through || ''
    }));
  }, [selectedCustomer]);

  /* ─── Product global search ─── */
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setGlobalProducts([]);
      setLoadingGlobalSearch(false);
      return;
    }
    setLoadingGlobalSearch(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/search/global?name=${encodeURIComponent(searchQuery.trim())}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => setGlobalProducts(
          data.map(p => ({
            ...p, id: Number(p.id),
            rate_per_box: parseFloat(p.rate_per_box) || 0,
            shortGodown: shortenGodownName(p.godown_name)
          }))
        ))
        .catch(() => setGlobalProducts([]))
        .finally(() => setLoadingGlobalSearch(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addGlobalProduct = (p) => {
    if (cart.some(i => i.id === p.id)) { setError('Item already in cart'); return; }
    setCart(prev => [...prev, {
      ...p, cases: 1, discount: 0, godown: p.shortGodown,
      per_case: p.per_case || 1, current_cases: p.current_cases || 0,
      rate_per_box: parseFloat(p.rate_per_box) || 0
    }]);
    setSearchQuery(''); setGlobalProducts([]);
  };

  const updateCases = (idx, val) => {
    const maxCases = fromChallan ? 999999 : (cart[idx].current_cases || 999999);
    setCart(p => p.map((i, i2) => i2 === idx ? { ...i, cases: Math.max(1, Math.min(Number(val) || 1, maxCases)) } : i));
  };
  const updateRate = (idx, val) =>
    setCart(p => p.map((i, i2) => i2 === idx ? { ...i, rate_per_box: parseFloat(val) || 0 } : i));
  const removeFromCart = (idx) => setCart(p => p.filter((_, i) => i !== idx));

  const calculate = () => {
    let subtotal = 0, totalCases = 0;
    cart.forEach(i => {
      const cases = parseFloat(i.cases) || 0, perCase = parseFloat(i.per_case) || 1;
      const rate = parseFloat(i.rate_per_box) || 0, disc = parseFloat(i.discount || 0) / 100;
      subtotal += cases * perCase * rate * (1 - disc);
      totalCases += cases;
    });
    const packing = applyProcessingFee ? subtotal * (parseFloat(packingPercent) || 3) / 100 : 0;
    const extraAmt = parseFloat(taxableValue) || 0;
    const taxable = subtotal + packing + extraAmt;
    const discAmt = taxable * (parseFloat(additionalDiscount) || 0) / 100;
    const net = taxable - discAmt;
    let cgst = 0, sgst = 0, igst = 0;
    if (applyIGST) igst = net * 0.18;
    else if (applyCGST && applySGST) { cgst = net * 0.09; sgst = net * 0.09; }
    return {
      subtotal: +subtotal.toFixed(2), packing: +packing.toFixed(2),
      discAmt: +discAmt.toFixed(2), net: +net.toFixed(2),
      cgst: +cgst.toFixed(2), sgst: +sgst.toFixed(2), igst: +igst.toFixed(2),
      extraAmt: +extraAmt.toFixed(2), grand: Math.round(net + cgst + sgst + igst), totalCases
    };
  };
  const calc = cart.length > 0 ? calculate() : {
    subtotal: 0, packing: 0, discAmt: 0, net: 0,
    cgst: 0, sgst: 0, igst: 0, extraAmt: 0, grand: 0, totalCases: 0
  };

  const handleLoadChallan = async (challan) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/challan/${challan.id}`);
      if (!res.ok) throw new Error('Failed');
      const full = await res.json();
      setCustomer({
        name: full.customer_name || '', address: full.address || '', gstin: full.gstin || '',
        lr_number: full.lr_number || '', agent_name: 'DIRECT',
        from: full.from || 'SIVAKASI', to: full.to || '', through: full.through || ''
      });
      setCart((full.items || []).map(item => ({
        ...item, cases: Number(item.cases) || 0, per_case: Number(item.per_case) || 1,
        rate_per_box: parseFloat(item.rate_per_box) || 0,
        discount: parseFloat(item.discount_percent || item.discount || 0),
        godown: item.godown || full.from || 'SIVAKASI', current_cases: 999999
      })));
      setFromChallan(true); setChallanId(challan.id);
      const matched = godowns.find(g =>
        full.from?.toLowerCase().includes(g.label.toLowerCase()) ||
        g.label.toLowerCase().includes(full.from?.toLowerCase())
      );
      if (matched) setSelectedGodown(matched);
      setSuccess(`Challan ${challan.challan_number} loaded!`);
      setShowPendingDropdown(false);
    } catch (err) { setError(err.message || 'Failed to load challan'); }
  };

  const submitBooking = async () => {
    if (!customer.name.trim() || cart.length === 0 || !customer.to.trim() || !customer.through.trim()) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        bill_date: billDate || getIndianDate(),
        customer_name: customer.name.trim(), address: customer.address.trim(),
        gstin: customer.gstin.trim(), lr_number: customer.lr_number.trim(),
        agent_name: customer.agent_name.trim() || 'DIRECT',
        from: customer.from.trim() || 'SIVAKASI', to: customer.to.trim(),
        through: customer.through.trim(),
        additional_discount: parseFloat(additionalDiscount) || 0,
        packing_percent: parseFloat(packingPercent) || 3.0,
        taxable_value: taxableValue ? parseFloat(taxableValue) : null,
        stock_from: selectedGodown?.shortName || customer.from || 'SIVAKASI',
        apply_processing_fee: applyProcessingFee, apply_cgst: applyCGST,
        apply_sgst: applySGST, apply_igst: applyIGST,
        from_challan: fromChallan, challan_id: challanId, is_direct_bill: !fromChallan,
        performed_by: localStorage.getItem('username') || 'Unknown',
        items: cart.map(i => ({
          id: Number(i.id), productname: i.productname?.trim() || '',
          brand: i.brand?.trim() || '', cases: Number(i.cases) || 1,
          per_case: Number(i.per_case) || 1, discount_percent: parseFloat(i.discount) || 0,
          godown: i.godown?.trim() || 'SIVAKASI', rate_per_box: parseFloat(i.rate_per_box) || 0
        }))
      };
      const res = await fetch(`${API_BASE_URL}/api/booking`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Server error: ${res.status}`);
      setSuccess(`Bill ${data.bill_number || ''} created!`);
      if (data.pdfBase64) {
        setPdfBlobUrl(data.pdfBase64); setBillNumber(data.bill_number || ''); setShowPDFModal(true);
      } else setError('Bill saved but PDF generation failed.');
      setCart([]); setCustomer({ name: '', address: '', gstin: '', lr_number: '', agent_name: '', from: 'SIVAKASI', to: '', through: '' });
      setBillDate(getIndianDate());
      setSelectedCustomer(null); setAdditionalDiscount(0); setTaxableValue('');
      setFromChallan(false); setChallanId(null);
    } catch (err) { setError(err.message || 'Failed to create bill'); }
    finally { setLoading(false); }
  };

  const modalStyle = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
    content: { position: 'relative', inset: 'unset', background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '960px', height: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      {/* ─── Challan Bell ─── */}
      {pendingChallans.length > 0 && (
        <div className="fixed top-20 right-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowPendingDropdown(!showPendingDropdown)}
              className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-110 transition-transform"
            >
              <FaBell className="text-white text-lg" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0c10]">
                {pendingChallans.length}
              </span>
            </button>
            {showPendingDropdown && (
              <div className="absolute right-0 mt-3 w-96 bg-[#111318] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm text-white">
                  Pending Challans ({pendingChallans.length})
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-white/6">
                  {pendingChallans.map(ch => (
                    <div key={ch.id} className="flex justify-between items-start p-4 hover:bg-white/4 transition">
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{ch.challan_number}</p>
                        <p className="text-white/75 text-sm">{ch.customer_name}</p>
                        <p className="text-white/45 text-xs mt-0.5">→ {ch.to} · {new Date(ch.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <button onClick={() => handleLoadChallan(ch)}
                        className="ml-3 flex-shrink-0 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                        Generate Bill
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowPendingDropdown(false)}
                  className="w-full py-2.5 bg-white/4 hover:bg-white/8 text-white/50 text-xs transition">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Main content ─── */}
      <div className="flex-1 p-4 pt-20 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-5 pb-10">

          {/* Heading */}
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">Billing</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Create Bill</h1>
            {fromChallan && (
              <p className="mt-1.5 text-xs text-green-400 uppercase tracking-widest font-semibold">⚡ From Challan — Stock Check Bypassed</p>
            )}
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm">{error}</div>}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-400/25 rounded-xl text-green-300 text-sm flex items-center gap-2">
              <FaCheckCircle /> {success}
            </div>
          )}

          {/* Customer select */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">
              Select Existing Customer <span className="normal-case text-white/30 font-normal">(optional)</span>
            </p>
            <Select
              options={customers} value={selectedCustomer} onChange={setSelectedCustomer}
              placeholder="Search / Select Customer..." isClearable isLoading={loadingCustomers}
              styles={selectStyles} menuPortalTarget={document.body} menuPosition="fixed"
            />
          </div>

          {/* Customer details */}
          <div className="bg-[#111318] border border-white/10 rounded-xl overflow-visible">
            <button
              onClick={() => setIsCustomerDetailsOpen(!isCustomerDetailsOpen)}
              className="w-full flex justify-between items-center px-5 py-4 bg-[#181c24] hover:bg-[#1e2330] transition rounded-xl"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-white">Customer Details</span>
              {isCustomerDetailsOpen
                ? <FaChevronUp className="text-white/35 text-xs" />
                : <FaChevronDown className="text-white/35 text-xs" />}
            </button>
            {isCustomerDetailsOpen && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/8">
                <Field label="Bill Date *" type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
                <Field label="Party Name *" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                <Field label="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                <Field label="GSTIN" value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} />
                <Field label="L.R. Number" value={customer.lr_number} onChange={e => setCustomer({ ...customer, lr_number: e.target.value })} />
                <Field label="Agent Name" value={customer.agent_name} onChange={e => setCustomer({ ...customer, agent_name: e.target.value })} />
                <Field label="From" value={customer.from} onChange={e => setCustomer({ ...customer, from: e.target.value })} />
                <Field label="To *" value={customer.to} onChange={e => setCustomer({ ...customer, to: e.target.value })} />
                <Field label="Through *" value={customer.through} onChange={e => setCustomer({ ...customer, through: e.target.value })} />
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-[#111318] border border-white/10 rounded-xl overflow-visible">
              <div className="px-5 py-4 bg-[#181c24] rounded-t-xl border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Cart — {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#181c24]">
                      {['#','Product','Cases','Per','Qty','Rate (₹)','Amount','From',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {cart.map((item, idx) => {
                      const qty = item.cases * item.per_case;
                      const finalAmt = qty * item.rate_per_box * (1 - (item.discount / 100));
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition">
                          <td className="px-4 py-3 text-white/35 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-white font-semibold text-sm whitespace-nowrap">
                            {item.productname}
                            {item.brand ? (
                              <span className="text-[#3fedd8] text-xs ml-1.5 font-normal">
                                ({capitalize(item.brand)})
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" min="1" max={item.current_cases || 999999} value={item.cases}
                              onChange={e => updateCases(idx, parseInt(e.target.value) || 1)}
                              className="w-20 bg-[#1e2330] border border-white/15 rounded-md px-2 py-1.5 text-white text-sm text-center outline-none focus:border-[#3fedd8] transition" />
                          </td>
                          <td className="px-4 py-3 text-white/55 text-sm">{item.per_case}</td>
                          <td className="px-4 py-3 text-white text-sm font-medium">{qty}</td>
                          <td className="px-4 py-3">
                            <input type="number" step="0.01" min="0" value={item.rate_per_box}
                              onChange={e => updateRate(idx, e.target.value)} onFocus={e => e.target.select()}
                              className="w-24 bg-[#1e2330] border border-white/15 rounded-md px-2 py-1.5 text-white text-sm text-center outline-none focus:border-[#3fedd8] transition" />
                          </td>
                          <td className="px-4 py-3 text-green-400 font-semibold text-sm whitespace-nowrap">₹{finalAmt.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sky-300 text-sm whitespace-nowrap">{item.godown}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-300 transition p-1">
                              <FaTrash className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-5">
                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/8">
                  <div className="space-y-1.5 text-sm">
                    <p className="text-white/55">Bill Date: <span className="text-[#3fedd8] font-bold">{billDate ? billDate.split('-').reverse().join('/') : '—'}</span></p>
                    <p className="text-white/55">Total Cases: <span className="text-white font-bold">{calc.totalCases}</span></p>
                    <p className="text-white/55">From: <span className="text-white">{customer.from || '—'}</span></p>
                    <p className="text-white/55">To: <span className="text-white">{customer.to || '—'}</span></p>
                    <p className="text-white/55">Via: <span className="text-white">{customer.through || '—'}</span></p>
                  </div>
                  <div className="text-right space-y-1.5 text-sm">
                    <p className="text-white/55">Goods Value: <span className="text-white font-medium">₹{calc.subtotal}</span></p>
                    {applyProcessingFee && <p className="text-white/55">Packing @ {packingPercent}%: <span className="text-white font-medium">₹{calc.packing}</span></p>}
                    {calc.extraAmt > 0 && <p className="text-white/55">Extra Taxable: <span className="text-sky-300 font-medium">₹{calc.extraAmt}</span></p>}
                    {calc.discAmt > 0 && <p className="text-white/55">Discount: <span className="text-red-400 font-medium">−₹{calc.discAmt}</span></p>}
                    {applyCGST && <p className="text-white/55">CGST 9%: <span className="text-white font-medium">₹{calc.cgst}</span></p>}
                    {applySGST && <p className="text-white/55">SGST 9%: <span className="text-white font-medium">₹{calc.sgst}</span></p>}
                    {applyIGST && <p className="text-white/55">IGST 18%: <span className="text-white font-medium">₹{calc.igst}</span></p>}
                    <p className="text-2xl font-black text-green-400 pt-1">₹{calc.grand}</p>
                  </div>
                </div>

                {/* Extras row */}
                <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-white/8">
                  <div className="flex-1 min-w-[150px]">
                    <Field label="Bill Date *" type="date" value={billDate}
                      onChange={e => setBillDate(e.target.value)} />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Field label="Additional Discount (%)" type="number" value={additionalDiscount}
                      onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <input type="checkbox" checked={applyProcessingFee} onChange={e => setApplyProcessingFee(e.target.checked)}
                        className="w-4 h-4 accent-[#3fedd8] cursor-pointer" />
                      <span className="text-sm font-semibold text-white">Packing @ {packingPercent}%</span>
                    </div>
                    <Field label="Packing %" type="number" step="0.1" value={packingPercent}
                      onChange={e => setPackingPercent(parseFloat(e.target.value) || 0)} disabled={!applyProcessingFee} />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Field label="Extra Taxable Amount" type="number" value={taxableValue}
                      onChange={e => setTaxableValue(e.target.value)} />
                  </div>
                </div>

                {/* GST selector */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={() => {
                      if (applyCGST && applySGST) { setApplyCGST(false); setApplySGST(false); }
                      else { setApplyCGST(true); setApplySGST(true); setApplyIGST(false); }
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      applyCGST && applySGST
                        ? 'border-green-400/50 bg-green-400/8 text-green-400'
                        : 'border-white/10 bg-[#181c24] text-white/60 hover:border-green-400/30'
                    }`}
                  >
                    <p className="font-bold text-base">Tamil Nadu</p>
                    <p className="text-xs opacity-65 mt-0.5">CGST 9% + SGST 9%</p>
                  </button>
                  <button
                    onClick={() => {
                      if (applyIGST) { setApplyIGST(false); }
                      else { setApplyIGST(true); setApplyCGST(false); setApplySGST(false); }
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      applyIGST
                        ? 'border-[#3fedd8]/50 bg-[#3fedd8]/8 text-[#3fedd8]'
                        : 'border-white/10 bg-[#181c24] text-white/60 hover:border-[#3fedd8]/30'
                    }`}
                  >
                    <p className="font-bold text-base">Other State</p>
                    <p className="text-xs opacity-65 mt-0.5">IGST 18%</p>
                  </button>
                </div>
                <div className={`mt-3 py-2.5 px-4 bg-[#181c24] rounded-xl text-center text-sm font-medium ${
                  applyCGST && applySGST ? 'text-green-400' : applyIGST ? 'text-[#3fedd8]' : 'text-amber-400'
                }`}>
                  {applyCGST && applySGST ? '✓ CGST 9% + SGST 9% (Tamil Nadu)'
                    : applyIGST ? '✓ IGST 18% (Other States)'
                    : '— No GST Selected'}
                </div>
              </div>
            </div>
          )}

          {/* Product search */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">Search Products (All Godowns)</p>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none" />
              <input
                type="text"
                placeholder="Type product name (min 2 chars)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e2330] border border-white/15 rounded-lg pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/15 transition"
              />
            </div>

            {loadingGlobalSearch && (
              <p className="mt-3 text-[#3fedd8] text-xs uppercase tracking-widest flex items-center gap-2">
                <FaSpinner className="animate-spin" /> Searching...
              </p>
            )}

            {globalProducts.length > 0 && (
              <div className="mt-3 border border-[#3fedd8]/20 rounded-xl overflow-hidden max-h-80 overflow-y-auto bg-[#1a1f2e] shadow-xl shadow-black/40">
                {globalProducts.map(p => (
                  <div key={p.id} onClick={() => addGlobalProduct(p)}
                    className="flex justify-between items-center px-5 py-3.5 border-b border-white/6 last:border-b-0 cursor-pointer hover:bg-[#3fedd8]/6 transition">
                    <div>
                      <p className="font-bold text-white text-sm">
                        {p.productname}
                        {p.brand ? (
                          <span className="text-[#3fedd8] text-xs font-normal ml-1.5">
                            ({capitalize(p.brand)})
                          </span>
                        ) : null}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{p.shortGodown}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-green-400 font-bold text-sm">₹{p.rate_per_box.toFixed(2)}/box</p>
                      <p className="text-white/40 text-xs">{p.current_cases} cases</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingGlobalSearch && searchQuery.trim().length >= 2 && globalProducts.length === 0 && (
              <p className="mt-3 text-white/35 text-xs">No products found for "{searchQuery}"</p>
            )}
          </div>

          {/* Godown picker */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-1">Select Godown</p>
            <p className="text-sm font-bold text-white mb-3">
              Selected: <span className="text-[#3fedd8]">{selectedGodown ? selectedGodown.label : 'None'}</span>
            </p>
            {loadingGodowns
              ? <div className="flex items-center gap-2 text-white/45 text-sm"><FaSpinner className="animate-spin text-[#3fedd8]" /> Loading godowns...</div>
              : <Select options={godowns} value={selectedGodown} onChange={setSelectedGodown}
                  placeholder="Choose Godown..." isClearable styles={selectStyles}
                  menuPortalTarget={document.body} menuPosition="fixed" />
            }
          </div>

          {/* Stock grid */}
          {selectedGodown && (
            <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-[#181c24] border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-widest text-white">Stock in {selectedGodown.label}</span>
              </div>
              <div className="p-5">
                {loadingStock
                  ? <div className="text-center py-12"><FaSpinner className="animate-spin text-3xl text-[#3fedd8] mx-auto" /></div>
                  : filteredStock.length > 0
                    ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredStock.map(item => (
                          <div key={item.id} className="bg-[#1e2330] border border-white/10 rounded-xl p-4 hover:border-[#3fedd8]/30 hover:-translate-y-0.5 transition-all">
                            <p className="font-bold text-white text-sm truncate mb-1" title={item.productname}>
                              {item.productname}
                              {item.brand ? (
                                <span className="text-[#3fedd8] text-xs font-normal ml-1.5">
                                  ({capitalize(item.brand)})
                                </span>
                              ) : null}
                            </p>
                            <p className="text-white/50 text-xs">Cases: {item.current_cases}</p>
                            <p className="text-white/50 text-xs mb-1">Per: {item.per_case}</p>
                            <p className="text-green-400 font-black text-xl mt-2 mb-3">₹{item.rate_per_box.toFixed(2)}</p>
                            <button
                              disabled={item.current_cases <= 0}
                              onClick={() => {
                                if (cart.some(i => i.id === item.id)) return setError('Already in cart');
                                setCart(prev => [...prev, {
                                  ...item, cases: 1, discount: 0,
                                  godown: selectedGodown.shortName,
                                  rate_per_box: parseFloat(item.rate_per_box) || 0
                                }]);
                              }}
                              className="w-full bg-[#3fedd8]/10 border border-[#3fedd8]/20 text-[#3fedd8] py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#3fedd8]/18 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              <FaPlus className="text-[10px]" /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    : <p className="text-center text-white/30 py-10 text-sm">No stock available in this godown</p>
                }
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center">
            <button onClick={submitBooking} disabled={loading || cart.length === 0}
              className="flex items-center gap-2.5 bg-[#3fedd8] text-[#0a0c10] font-black text-base px-12 py-4 rounded-xl hover:opacity-88 hover:-translate-y-0.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none transition-all shadow-lg shadow-[#3fedd8]/20">
              {loading ? <><FaSpinner className="animate-spin" /> Generating...</> : <><FaFilePdf /> Generate Bill</>}
            </button>
          </div>

        </div>
      </div>

      {/* PDF Modal */}
      <Modal isOpen={showPDFModal} onRequestClose={() => setShowPDFModal(false)}
        className="_" overlayClassName="_" style={modalStyle}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center px-6 py-4 bg-[#181c24] border-b border-white/8">
            <h2 className="text-white font-black text-lg">Bill: {billNumber}</h2>
            <div className="flex gap-2">
              <a href={pdfBlobUrl} download={`${billNumber}.pdf`}
                className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500/22 transition">
                <FaDownload className="text-xs" /> Download
              </a>
              <button onClick={() => setShowPDFModal(false)}
                className="flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/65 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/12 transition">
                <FaTimes className="text-xs" /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 bg-[#0a0c10] p-4">
            <embed src={pdfBlobUrl} type="application/pdf" className="w-full h-full rounded-lg" />
          </div>
        </div>
      </Modal>
    </div>
  );
}