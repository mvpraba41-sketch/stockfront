import React, { useState, useEffect } from 'react';
import { FaTrash, FaSpinner, FaCheckCircle, FaSearch, FaChevronDown, FaChevronUp, FaDownload, FaPlus } from 'react-icons/fa';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import { API_BASE_URL } from '../../../Config';
import Select from 'react-select';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

/* ─── PDF styles (unchanged) ─── */
const pdfStyles = StyleSheet.create({
  page: { padding: 40 },
  title: { fontSize: 36, textAlign: "center", marginBottom: 6, fontWeight: "bold", color: "#b91c1c" },
  tagline: { fontSize: 11, textAlign: "center", marginBottom: 30, color: "#666", fontStyle: "italic" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  customerInfo: { flex: 1 },
  challanInfo: { width: 200, textAlign: "right" },
  label: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  valueBold: { fontSize: 16, fontWeight: "bold" },
  value: { fontSize: 11, color: "#444", marginBottom: 3 },
  table: { marginTop: 20, border: "1px solid #000" },
  row: { flexDirection: "row" },
  headerCell: { padding: 10, fontSize: 10, fontWeight: "bold", textAlign: "center", backgroundColor: "#1e3a8a", color: "white" },
  cell: { padding: 8, fontSize: 10, textAlign: "center", borderBottom: "0.5px solid #ccc" },
  totalBox: { marginTop: 30, padding: 16, backgroundColor: "#fef3c7", borderRadius: 10, alignItems: "center" },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#92400e" },
  transportBox: { marginTop: 35, padding: 18, backgroundColor: "#f0f9ff", borderRadius: 10, fontSize: 12, border: "1px dashed #3b82f6" },
  footer: { position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#666" },
});

const ChallanPDF = ({ data }) => {
  const totalCases = data.items.reduce((s, i) => s + i.cases, 0);
  const totalQty = data.items.reduce((s, i) => s + i.cases * i.per_case, 0);
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>DELIVERY CHALLAN</Text>
        <Text style={pdfStyles.tagline}>Goods Once Sold Will Not Be Taken Back or Exchanged</Text>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.customerInfo}>
            <Text style={pdfStyles.label}>To:</Text>
            <Text style={pdfStyles.valueBold}>{data.name}</Text>
            {data.address && <Text style={pdfStyles.value}>{data.address}</Text>}
            {data.gstin && <Text style={pdfStyles.value}>GSTIN: {data.gstin}</Text>}
            <Text style={pdfStyles.value}>Created By: {data.created_by}</Text>
          </View>
          <View style={pdfStyles.challanInfo}>
            <Text style={{ fontSize: 13 }}>Date: {new Date().toLocaleDateString("en-IN")}</Text>
            <Text style={{ fontSize: 11, marginTop: 8 }}>Challan No: <Text style={{ fontWeight: "bold" }}>{data.challan_number}</Text></Text>
          </View>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.row}>
            {["S.No","Brand","Product","Cases","Per","Qty","Godown"].map((h, i) => (
              <Text key={i} style={[pdfStyles.headerCell, { width: ["7%","20%","38%","11%","11%","11%","22%"][i] }]}>{h}</Text>
            ))}
          </View>
          {data.items.map((item, i) => (
            <View style={pdfStyles.row} key={i}>
              <Text style={[pdfStyles.cell, { width: "7%" }]}>{i + 1}</Text>
              <Text style={[pdfStyles.cell, { width: "20%" }]}>{item.brand || ''}</Text>
              <Text style={[pdfStyles.cell, { width: "38%" }]}>{item.productname}</Text>
              <Text style={[pdfStyles.cell, { width: "11%" }]}>{item.cases}</Text>
              <Text style={[pdfStyles.cell, { width: "11%" }]}>{item.per_case}</Text>
              <Text style={[pdfStyles.cell, { width: "11%" }]}>{item.cases * item.per_case}</Text>
              <Text style={[pdfStyles.cell, { width: "22%", color: "#dc2626", fontWeight: "bold" }]}>{item.godown}</Text>
            </View>
          ))}
        </View>
        <View style={pdfStyles.totalBox}>
          <Text style={pdfStyles.totalText}>Total Cases: {totalCases}  |  Total Quantity: {totalQty}</Text>
        </View>
        <View style={pdfStyles.transportBox}>
          <Text style={{ fontSize: 15, fontWeight: "bold", marginBottom: 10, color: "#1e40af" }}>Transport Details</Text>
          <Text>From      : {data.from || 'SIVAKASI'}</Text>
          <Text>To        : {data.to}</Text>
          <Text>Through   : <Text style={{ fontWeight: "bold", color: "#dc2626" }}>{data.through}</Text></Text>
          {data.lr_number && <Text>LR Number : <Text style={{ fontWeight: "bold", color: "#dc2626" }}>{data.lr_number}</Text></Text>}
        </View>
        <Text style={pdfStyles.footer}>This is a computer-generated Delivery Challan • Subject to Sivakasi Jurisdiction</Text>
      </Page>
    </Document>
  );
};

/* ─── react-select dark theme ─── */
const selectStyles = {
  control: (b, s) => ({
    ...b, background: '#1e2330',
    borderColor: s.isFocused ? '#3fedd8' : 'rgba(255,255,255,0.15)',
    borderRadius: '8px', minHeight: '46px',
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
};

/* ─── Field: white label ABOVE input ─── */
const Field = ({ label, value, onChange, placeholder = '' }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-white">{label}</label>
    <input
      type="text" value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-[#1e2330] border border-white/15 rounded-lg px-4 py-3 text-white text-sm placeholder-white/25 outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/20 transition-all"
    />
  </div>
);

export default function Delivery() {
  const [godowns, setGodowns] = useState([]);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [stock, setStock] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalProducts, setGlobalProducts] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [isCustomerOpen, setIsCustomerOpen] = useState(true);
  const [customer, setCustomer] = useState({ name: '', address: '', gstin: '', lr_number: '', from: 'SIVAKASI', to: '', through: '' });

  const usernameFromStorage = localStorage.getItem('username');
  const created_by = (() => {
    if (!usernameFromStorage) return 'Admin';
    try { const p = JSON.parse(usernameFromStorage); return (typeof p === 'object' && p.name) ? p.name : p; }
    catch { return usernameFromStorage.trim() || 'Admin'; }
  })();

  const shortenGodownName = (name) =>
    name?.replace(/_/g, ' ').trim().split(/\s+/).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase()).join('') || '';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/godown`)
      .then(r => r.json())
      .then(d => setGodowns(d.map(g => ({ value: g.id, label: g.name, shortName: shortenGodownName(g.name) }))));
  }, []);

  useEffect(() => {
    if (!selectedGodown) { setStock([]); return; }
    setStockLoading(true);
    fetch(`${API_BASE_URL}/api/godown/stock/${selectedGodown.value}`)
      .then(r => r.json())
      .then(data => setStock(data.filter(i => i.current_cases > 0).map(i => ({ ...i, id: Number(i.id) }))))
      .catch(() => setStock([]))
      .finally(() => setStockLoading(false));
  }, [selectedGodown]);

  useEffect(() => {
    if (searchQuery.length < 2) { setGlobalProducts([]); setGlobalLoading(false); return; }
    setGlobalLoading(true);
    const t = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/search/global?name=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => setGlobalProducts(data.map(p => ({
          ...p, shortGodown: shortenGodownName(p.godown_name),
          product_type: (p.product_type || '').toLowerCase().trim().replace(/\s+/g, '_')
        }))))
        .catch(() => setGlobalProducts([]))
        .finally(() => setGlobalLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addToCart = (item) => {
    if (cart.some(i => i.id === item.id)) { setError('Item already in cart'); return; }
    setCart(prev => [...prev, {
      ...item, cases: 1,
      godown: selectedGodown?.shortName || shortenGodownName(item.godown_name) || item.godown_name,
      product_type: (item.product_type || '').toString().toLowerCase().trim().replace(/\s+/g, '_') || 'unknown'
    }]);
  };

  const updateCases = (idx, val) => {
    const cases = Math.max(1, Math.min(val, cart[idx].current_cases || 999));
    setCart(prev => prev.map((i, i2) => i2 === idx ? { ...i, cases } : i));
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const generateChallan = async () => {
    if (!customer.name?.trim()) return setError('Party Name required');
    if (!customer.to?.trim()) return setError('Destination required');
    if (!customer.through?.trim()) return setError('Transport required');
    if (cart.length === 0) return setError('Add items to cart');
    setLoading(true); setError(''); setSuccess('');
    const payload = {
      ...customer,
      items: cart.map(i => ({ id: i.id, productname: i.productname, brand: i.brand || '', cases: i.cases, per_case: Math.max(1, i.per_case || 1), godown: i.godown, product_type: i.product_type })),
      created_by
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/challan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      const fullData = { ...payload, challan_number: data.challan_number };
      setPdfData(fullData); setShowPDF(true);
      setSuccess(`Challan ${data.challan_number} created!`);
      const blob = await pdf(<ChallanPDF data={fullData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Challan_${data.challan_number}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setCart([]);
      setCustomer({ name: '', address: '', gstin: '', lr_number: '', from: 'SIVAKASI', to: '', through: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const manualDownload = async () => {
    if (!pdfData) return;
    try {
      const blob = await pdf(<ChallanPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Challan_${pdfData.challan_number}.pdf`;
      a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { setError("Download failed."); }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 pt-20 px-4 pb-10 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Heading */}
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">Logistics</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Delivery Challan</h1>
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-sm">{error}</div>}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-400/25 rounded-xl text-green-300 text-sm flex items-center gap-2">
              <FaCheckCircle /> {success}
            </div>
          )}

          {/* Customer & Transport */}
          <div className="bg-[#111318] border border-white/10 rounded-xl overflow-visible">
            <button
              onClick={() => setIsCustomerOpen(!isCustomerOpen)}
              className="w-full flex justify-between items-center px-5 py-4 bg-[#181c24] hover:bg-[#1e2330] transition rounded-xl text-left"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-white">Customer &amp; Transport Details</span>
              {isCustomerOpen ? <FaChevronUp className="text-white/35 text-xs" /> : <FaChevronDown className="text-white/35 text-xs" />}
            </button>
            {isCustomerOpen && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/8">
                <Field label="Party Name *" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                <Field label="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                <Field label="GSTIN" value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} />
                <Field label="L.R. Number" value={customer.lr_number} onChange={e => setCustomer({ ...customer, lr_number: e.target.value })} />
                <Field label="From" value={customer.from} onChange={e => setCustomer({ ...customer, from: e.target.value })} />
                <Field label="To *" value={customer.to} onChange={e => setCustomer({ ...customer, to: e.target.value })} />
                <Field label="Through *" value={customer.through} onChange={e => setCustomer({ ...customer, through: e.target.value })} />
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-[#181c24] border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-widest text-white">Cart — {cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#181c24]">
                      {['#', 'Brand', 'Product', 'Cases', 'Per', 'Qty', 'Godown', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {cart.map((item, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3 text-white/35 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-white text-sm">{item.brand || '—'}</td>
                        <td className="px-4 py-3 text-white font-semibold text-sm">{item.productname}</td>
                        <td className="px-4 py-3">
                          <input type="number" min="1" max={item.current_cases} value={item.cases}
                            onChange={e => updateCases(i, parseInt(e.target.value) || 1)}
                            className="w-20 bg-[#1e2330] border border-white/15 rounded-md px-2 py-1.5 text-white text-sm text-center outline-none focus:border-[#3fedd8] transition" />
                        </td>
                        <td className="px-4 py-3 text-white/60 text-sm">{item.per_case || 1}</td>
                        <td className="px-4 py-3 text-green-400 font-bold text-sm">{item.cases * (item.per_case || 1)}</td>
                        <td className="px-4 py-3 text-red-400 font-bold text-sm">{item.godown}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-300 transition p-1">
                            <FaTrash className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Product Search */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">Search Products (All Godowns)</p>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none" />
              <input
                type="text" placeholder="Search products across all godowns..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e2330] border border-white/15 rounded-lg pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-[#3fedd8] focus:ring-2 focus:ring-[#3fedd8]/15 transition"
              />
              {globalLoading && <FaSpinner className="absolute right-4 top-3.5 animate-spin text-[#3fedd8] text-sm" />}
            </div>

            {globalProducts.length > 0 && (
              <div className="mt-3 border border-[#3fedd8]/20 rounded-xl overflow-hidden max-h-80 overflow-y-auto bg-[#1a1f2e] shadow-xl shadow-black/40">
                {globalProducts.map(p => (
                  <div key={p.id}
                    onClick={() => { addToCart(p); setSearchQuery(''); setGlobalProducts([]); }}
                    className="flex justify-between items-center px-5 py-3.5 border-b border-white/6 last:border-b-0 cursor-pointer hover:bg-[#3fedd8]/6 transition">
                    <div>
                      <p className="font-bold text-white text-sm">{p.productname}</p>
                      <p className="text-white/45 text-xs mt-0.5">
                        {p.brand && <span className="text-[#3fedd8]">{p.brand}</span>}
                        {p.brand && ' · '}{p.shortGodown}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-red-400 font-bold text-sm">{p.shortGodown}</p>
                      <p className="text-white/45 text-xs">{p.current_cases} cases · ₹{p.rate_per_box}/box</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Godown Select */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">Select Godown to Browse Stock</p>
            <Select
              options={godowns} value={selectedGodown} onChange={setSelectedGodown}
              placeholder="Select Godown..." styles={selectStyles}
              menuPortalTarget={document.body} menuPosition="fixed"
            />
          </div>

          {/* Stock Grid */}
          {selectedGodown && (
            <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-[#181c24] border-b border-white/8">
                <span className="text-xs font-bold uppercase tracking-widest text-white">Stock in {selectedGodown.label}</span>
              </div>
              <div className="p-5">
                {stockLoading
                  ? <div className="text-center py-12"><FaSpinner className="animate-spin text-3xl text-[#3fedd8] mx-auto" /></div>
                  : stock.length > 0
                    ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {stock.map(item => (
                          <div key={item.id} className="bg-[#1e2330] border border-white/10 rounded-xl p-4 hover:border-[#3fedd8]/30 hover:-translate-y-0.5 transition-all">
                            <p className="font-bold text-white text-sm truncate mb-1" title={item.productname}>{item.productname}</p>
                            <p className="text-white/50 text-xs">Brand: <span className="text-[#3fedd8] font-medium">{item.brand || 'N/A'}</span></p>
                            <p className="text-white/50 text-xs mb-3">Cases: <span className="text-green-400 font-bold">{item.current_cases}</span></p>
                            <button onClick={() => addToCart(item)}
                              className="w-full bg-[#3fedd8]/10 border border-[#3fedd8]/20 text-[#3fedd8] py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#3fedd8]/18 transition">
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
            <button onClick={generateChallan} disabled={loading || cart.length === 0}
              className="flex items-center gap-2.5 bg-[#3fedd8] text-[#0a0c10] font-black text-base px-12 py-4 rounded-xl hover:opacity-88 hover:-translate-y-0.5 disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none transition-all shadow-lg shadow-[#3fedd8]/20">
              {loading ? <><FaSpinner className="animate-spin" /> Generating...</> : 'Generate Challan'}
            </button>
          </div>

        </div>
      </div>

      {/* PDF Modal */}
      {showPDF && pdfData && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 bg-[#181c24] border-b border-white/8">
              <h3 className="text-white font-black text-lg">Challan: {pdfData.challan_number}</h3>
              <div className="flex gap-2">
                <button onClick={manualDownload}
                  className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-500/22 transition">
                  <FaDownload className="text-xs" /> Download
                </button>
                <button onClick={() => setShowPDF(false)}
                  className="flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/65 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/12 transition">
                  ✕ Close
                </button>
              </div>
            </div>
            <PDFViewer width="100%" height="100%" className="flex-1">
              <ChallanPDF data={pdfData} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}