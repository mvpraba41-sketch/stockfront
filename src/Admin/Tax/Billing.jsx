import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { FaSearch, FaTrash, FaFilePdf, FaTimes, FaDownload } from 'react-icons/fa';
import Modal from 'react-modal';
import InvoiceTemplate from '../../Component/InvoiceTemplate';
import { API_BASE_URL } from '../../../Config';

Modal.setAppElement("#root");

const FloatingLabelInput = ({ value, onChange, placeholder, type = "text" }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && value.toString().trim() !== '');
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-2 border rounded bg-white text-black focus:outline-none focus:border-blue-500 peer text-sm"
        placeholder=" "
      />
      <label className={`absolute left-3 transition-all pointer-events-none
        ${active ? '-top-3 text-xs bg-white px-2 text-blue-600 font-medium' : 'top-2 text-gray-500'}`}>
        {placeholder}
      </label>
    </div>
  );
};

export default function Billing() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [company, setCompany] = useState(null);

  const [billNumber, setBillNumber] = useState('Generating...');
  const [manualBillNo, setManualBillNo] = useState('');
  const [suggestedBillNo, setSuggestedBillNo] = useState('');

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [customer, setCustomer] = useState({ name: '', address: '', gstin: '', place: '' });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [through, setThrough] = useState();
  const [destination, setDestination] = useState('');
  const [packingPercent, setPackingPercent] = useState(0);
  const [extraTaxable, setExtraTaxable] = useState('');
  const [isIGST, setIsIGST] = useState(false);

  const [billType, setBillType] = useState('tax'); // 'tax' or 'supply'

  const [showModal, setShowModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const invoiceRef = useRef();

  const [search, setSearch] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);

  const subtotal = cart.reduce((s, i) => s + (i.cases || 0) * (i.rate_per_box || 0), 0);
  const totalCases = cart.reduce((s, i) => s + (i.cases || 0), 0);
  const packing = subtotal * (packingPercent / 100);
  const gstBaseAmount = subtotal + packing;
  const extraAmount = extraTaxable !== '' ? parseFloat(extraTaxable) || 0 : 0;

  const cgst = billType === 'tax' && !isIGST ? gstBaseAmount * 0.09 : 0;
  const sgst = billType === 'tax' && !isIGST ? gstBaseAmount * 0.09 : 0;
  const igst = billType === 'tax' && isIGST ? gstBaseAmount * 0.18 : 0;

  const taxableValue = gstBaseAmount + extraAmount;
  const totalTax = cgst + sgst + igst;
  const netAmount = Math.round(taxableValue + totalTax);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [companiesRes, productsRes, customersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/companies`),
          fetch(`${API_BASE_URL}/api/binvent/tproducts`),
          fetch(`${API_BASE_URL}/api/customers/recent`)
        ]);

        const companiesData = await companiesRes.json();
        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        const companiesList = Array.isArray(companiesData) ? companiesData : [companiesData];
        setCompanies(companiesList);
        if (companiesList.length > 0) {
          const firstCompany = companiesList[0];
          setSelectedCompanyId(firstCompany.id);
          setCompany(firstCompany);
        }

        const normalized = (Array.isArray(productsData) ? productsData : []).map(p => ({
          ...p,
          id: p.id || p._id || Math.random().toString(36).slice(2),
          productname: p.productname || p.name || 'Unnamed',
          hsn: p.hsn || p.hsn_code || '360410',
          rate_per_box: parseFloat(p.rate_per_box || p.rate || p.price || 0) || 0
        }));
        setProducts(normalized);

        setRecentCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!selectedCompanyId || companies.length === 0) return;

    const found = companies.find(c => String(c.id) === String(selectedCompanyId));
    if (found) {
      const normalized = {
        ...found,
        company_name: (found.company_name || 'NISHA TRADERS').trim(),
        address: (found.address || '').trim(),
        gstin: (found.gstin || '').trim(),
        email: (found.email || '').trim(),
        mobile: (found.mobile || '').trim(),
        logo_url: found.logo_url || '',
        signature_url: found.signature_url || '',
        bank_name: found.bank_name || 'Tamilnad Mercantile Bank Ltd.',
        branch: found.branch || 'SIVAKASI',
        account_no: found.account_no || '',
        ifsc_code: found.ifsc_code || ''
      };
      setCompany(normalized);

      const prefix = normalized.company_name
        .split(/\s+/)
        .map(w => w[0].toUpperCase())
        .slice(0, 2)
        .join('');

      fetch(`${API_BASE_URL}/api/latest?prefix=${prefix}`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          const nextBillNo = data.bill_no || `${prefix}-001`;
          setSuggestedBillNo(nextBillNo);
          setBillNumber(nextBillNo);
          setManualBillNo('');
        })
        .catch(() => {
          const fallback = `${prefix}-001`;
          setSuggestedBillNo(fallback);
          setBillNumber(fallback);
        });
    }
  }, [selectedCompanyId, companies, API_BASE_URL]);

  useEffect(() => {
    if (!manualBillNo.trim()) {
      setBillNumber(suggestedBillNo);
    }
  }, [manualBillNo, suggestedBillNo]);

  useEffect(() => {
    if (!search.trim()) {
      setProductSearchResults([]);
      return;
    }
    const q = search.toLowerCase();
    const results = products.filter(p =>
      p.productname.toLowerCase().includes(q) ||
      (p.hsn && p.hsn.toLowerCase().includes(q))
    );
    setProductSearchResults(results.slice(0, 30));
  }, [search, products]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch(`${API_BASE_URL}/api/states`);
        const data = await response.json();
        setStates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, [API_BASE_URL]);

  const addProductToCart = (p) => {
    if (!p) return;
    const newItem = {
      ...p,
      cases: 1,
      rate_per_box: p.rate_per_box || 0,
      uniqueId: Date.now() + Math.random()
    };
    setCart(prev => [...prev, newItem]);
  };

  const updateCases = (uniqueId, val) => {
    const cases = Math.max(1, parseInt(val) || 1);
    setCart(cart.map(item => item.uniqueId === uniqueId ? { ...item, cases } : item));
  };

  const removeItem = (uniqueId) => {
    setCart(cart.filter(item => item.uniqueId !== uniqueId));
  };

  const updateRate = (uniqueId, newRate) => {
    const rate = parseFloat(newRate) || 0;
    setCart(cart.map(item => 
      item.uniqueId === uniqueId ? { ...item, rate_per_box: rate } : item
    ));
  };

  const generateAndShowPDF = async () => {
    if (!customer.name || cart.length === 0) {
      alert('Please fill customer name and add at least one product');
      return;
    }

    setShowModal(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 3, useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, width, height);
      const pdfBlob = pdf.output('blob');
      const pdfUrlTemp = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrlTemp);

      const bookingData = {
        customer_name: customer.name,
        customer_address: customer.address || '',
        customer_gstin: customer.gstin || '',
        customer_place: customer.place || '',
        customer_state_code: isIGST ? 'other' : '33',
        through: through || 'DIRECT',
        destination: destination || '',
        bill_type: billType,  // ← Keep only this one
        items: JSON.stringify(cart.map(item => ({
          productname: item.productname,
          hsn_code: item.hsn || '360410',
          cases: item.cases,
          rate_per_box: item.rate_per_box,
        }))),
        subtotal,
        packing_amount: packing,
        extra_amount: extraAmount,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        net_amount: netAmount,
        bill_no: manualBillNo || billNumber,
        company_name: company.company_name
      };

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Bill saved successfully! Bill No: ${data.booking.bill_no}`);
      } else {
        const error = await res.text();
        alert('Failed to save bill: ' + error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF or save bill');
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return alert('Generate preview first');
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${billNumber || 'invoice'}.pdf`;
    a.click();
  };

  if (!company) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 text-center pt-32 text-2xl">Loading...</div>
      </div>
    );
  }

  const filteredCustomers = recentCustomers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 p-6 overflow-auto max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-blue-800 mb-6">Create Invoice</h1>

          <div className="text-center mb-10">
            <div className="inline-flex rounded-xl shadow-2xl overflow-hidden border-4 border-gray-300">
              <button
                onClick={() => setBillType('tax')}
                className={`px-12 py-5 font-bold text-xl transition-all ${
                  billType === 'tax'
                    ? 'bg-blue-700 text-white shadow-inner'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                TAX INVOICE
              </button>
              <button
                onClick={() => setBillType('supply')}
                className={`px-12 py-5 font-bold text-xl transition-all ${
                  billType === 'supply'
                    ? 'bg-orange-600 text-white shadow-inner'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                COMPOSISTION INVOICE
              </button>
            </div>
            <p className="mt-4 text-xl font-semibold dark:text-white text-black">
              Current Mode:{' '}
              <span className={billType === 'tax' ? 'text-blue-700' : 'text-orange-600'}>
                {billType === 'tax' ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <label className="block text-sm font-medium mb-2">Select Company</label>
              <select className="w-full border rounded px-3 py-2 mb-4" value={selectedCompanyId || ''} onChange={e => setSelectedCompanyId(e.target.value)}>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name || 'Unknown Company'}</option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-2">Select Previous Customer</label>
              <div className="relative mb-5">
                <input
                  type="text"
                  placeholder="Type to search customer..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full px-4 py-2 border rounded"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
                    {filteredCustomers.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                        onClick={() => {
                          setCustomer({
                            name: c.customer_name,
                            address: c.customer_address || '',
                            destination: c.destination || '',
                            place: c.customer_place || ''
                          });
                          setIsIGST(c.customer_state_code !== '33');
                          setCustomerSearch(c.customer_name);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="font-medium">{c.customer_name}</div>
                        <div className="text-xs text-gray-600">
                          {c.customer_place} • {c.customer_address || 'No GSTIN'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={generateAndShowPDF} className="w-full bg-green-600 text-white py-3 rounded flex items-center justify-center gap-2 text-lg font-medium">
                <FaFilePdf /> Generate & Save Bill
              </button>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bill Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualBillNo || billNumber}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setManualBillNo(val);
                        setBillNumber(val);
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder={suggestedBillNo}
                      className="w-full px-4 py-3 border-2 rounded-lg bg-white text-black focus:outline-none focus:border-blue-600 text-xl font-bold tracking-wider"
                    />

                    {!manualBillNo && billNumber === suggestedBillNo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Next:</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-bold">
                          {suggestedBillNo}
                        </span>
                      </div>
                    )}

                    {manualBillNo && manualBillNo !== suggestedBillNo && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualBillNo('');
                          setBillNumber(suggestedBillNo);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Use {suggestedBillNo}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    {manualBillNo ? (
                      <span>Custom: <strong>{manualBillNo}</strong></span>
                    ) : (
                      <span>Auto: <strong>{suggestedBillNo}</strong> (recommended)</span>
                    )}
                    {manualBillNo && (
                      <button
                        onClick={() => {
                          setManualBillNo('');
                          setBillNumber(suggestedBillNo);
                        }}
                        className="ml-3 text-blue-600 hover:underline"
                      >
                        ← Revert to suggested
                      </button>
                    )}
                  </div>
                </div>

                <div className=''>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Place of Supply *</label>
                  {loadingStates ? (
                    <div className="w-full px-4 py-2 border rounded bg-gray-50 text-gray-500">Loading states...</div>
                  ) : (
                    <select
                      className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={customer.place}
                      onChange={(e) => {
                        const selectedState = states.find(s => s.state_name === e.target.value);
                        setCustomer({ ...customer, place: e.target.value });
                        if (selectedState) setIsIGST(selectedState.code !== '33');
                      }}
                    >
                      <option value="">-- Select State --</option>
                      {states.map((state) => (
                        <option key={state.code} value={state.state_name}>
                          {state.code} - {state.state_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <FloatingLabelInput placeholder="Party Name *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                <FloatingLabelInput placeholder="Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
                <FloatingLabelInput placeholder="From" value={customer.gstin} onChange={e => setCustomer({...customer, gstin: e.target.value})} />
                <FloatingLabelInput placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} />
                <FloatingLabelInput placeholder="Through" value={through} onChange={e => setThrough(e.target.value)} />
              </div>

              <div className="mb-6 flex gap-8">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!isIGST} onChange={() => setIsIGST(false)} /> Tamil Nadu (CGST+SGST)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={isIGST} onChange={() => setIsIGST(true)} /> Other State (IGST)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingLabelInput type="number" placeholder="Packing %" value={packingPercent} onChange={e => setPackingPercent(parseFloat(e.target.value) || 0)} />
                <FloatingLabelInput type="text" placeholder="Manual Taxable Value" value={extraTaxable} onChange={e => setExtraTaxable(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded p-4 shadow">
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded" placeholder="Search products..." />
              </div>
              {productSearchResults.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto border rounded">
                  {productSearchResults.map(p => (
                    <div key={p.id} className="p-2 flex justify-between border-b hover:bg-gray-50">
                      <div>
                        <div className="font-semibold">{p.productname}</div>
                        <div className="text-xs text-gray-500">₹{p.rate_per_box.toFixed(2)}/box</div>
                      </div>
                      <button onClick={() => addProductToCart(p)} className="bg-blue-600 text-white px-4 py-1 rounded">Add</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <h4 className="font-bold mb-3">Cart ({cart.length} items)</h4>
                {cart.map(item => (
                  <div key={item.uniqueId} className="flex items-center gap-3 py-2 border-b">
                    <div className="flex-1">
                      <div className="font-medium">{item.productname}</div>
                      <div className="text-xs text-gray-600">HSN: {item.hsn || '360410'}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Rate/box</div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate_per_box}
                          onChange={(e) => updateRate(item.uniqueId, e.target.value)}
                          className="w-28 px-2 py-1 border rounded text-right font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Cases</div>
                        <input
                          type="number"
                          min="1"
                          value={item.cases}
                          onChange={e => updateCases(item.uniqueId, e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-center"
                        />
                      </div>
                      <button onClick={() => removeItem(item.uniqueId)} className="text-red-600 mt-4">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded p-6 shadow">
              <h4 className="font-bold text-lg mb-4">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Packing ({packingPercent}%)</span><span>₹{packing.toFixed(2)}</span></div>
                <div className="flex justify-between font-medium"><span>Taxable Value</span><span>₹{taxableValue.toFixed(2)}</span></div>
                {billType === 'tax' && !isIGST && <div className="flex justify-between"><span>CGST 9%</span><span>₹{cgst.toFixed(2)}</span></div>}
                {billType === 'tax' && !isIGST && <div className="flex justify-between"><span>SGST 9%</span><span>₹{sgst.toFixed(2)}</span></div>}
                {billType === 'tax' && isIGST && <div className="flex justify-between"><span>IGST 18%</span><span>₹{igst.toFixed(2)}</span></div>}
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-blue-700">
                  <span>NET AMOUNT</span>
                  <span>₹{netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white w-[68.2%] p-10 rounded shadow" style={{ border: '1px solid #111' }} ref={invoiceRef}>
            <InvoiceTemplate
              booking={{
                customer_name: customer.name,
                customer_address: customer.address,
                customer_gstin: customer.gstin,
                customer_place: customer.place,
                through,
                destination,
                bill_no: manualBillNo || billNumber,
                type: billType,
                items: JSON.stringify(cart.map(i => ({
                  productname: i.productname,
                  cases: i.cases,
                  rate_per_box: i.rate_per_box
                }))),
                subtotal,
                packing_amount: packing,
                extra_amount: extraAmount,
                cgst_amount: cgst,
                sgst_amount: sgst,
                igst_amount: igst,
                net_amount: netAmount,
                customer_state_code: isIGST ? 'other' : '33'
              }}
              company={company}
              states={states}
              billDate={new Date()}
            />
          </div>

          <Modal isOpen={showModal} onRequestClose={() => setShowModal(false)} className="bg-white rounded shadow-lg max-w-6xl mx-4 my-8" overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex justify-between items-center rounded-t">
              <h2 className="text-xl font-bold">
                {billType === 'tax' ? 'Tax Invoice' : 'Bill of Supply'} - {billNumber}
              </h2>
              <div className="flex gap-3">
                <button onClick={handleDownloadPdf} className="bg-green-600 px-4 py-2 rounded flex items-center gap-2"><FaDownload /> Download</button>
                <button onClick={() => setShowModal(false)} className="bg-red-600 px-4 py-2 rounded flex items-center gap-2"><FaTimes /> Close</button>
              </div>
            </div>
            <div style={{ width: '100%', height: '80vh', background: '#f2f2f2' }}>
              <iframe title="PDF Preview" style={{ width: '100%', height: '100%', border: 0 }} src={pdfUrl || ''}></iframe>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}