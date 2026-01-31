import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../Config";
import Sidebar from "../Sidebar/Sidebar";
import Logout from "../../Admin/Logout";
import { FaTruck, FaRupeeSign, FaCalendarAlt, FaPrint } from "react-icons/fa";
import Modal from "react-modal";

Modal.setAppElement("#root");

const PAGE_SIZE = 8;

export default function Ledger() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/sbooking`);
        setBookings(res.data);
        setFiltered(res.data);
      } catch (err) {
        setError("Failed to load ledger");
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  useEffect(() => {
    const s = searchTerm.toLowerCase();
    const filteredData = bookings.filter(b =>
      b.bill_number?.toLowerCase().includes(s) ||
      b.customer_name?.toLowerCase().includes(s)
    );
    setFiltered(filteredData);
    setCurrentPage(1);
  }, [searchTerm, bookings]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openModal = (booking) => setSelectedBooking(booking);
  const closeModal = () => setSelectedBooking(null);

  const printLedger = () => {
    if (!selectedBooking) return;

    const customerBookings = bookings.filter(
      b => b.customer_name?.toLowerCase() === selectedBooking.customer_name?.toLowerCase()
    );

    let totalInvoiceAmount = 0;
    let totalPaid = 0;
    let extraSummary = {
      pf: 0, taxable: 0, discount: 0,
      cgst: 0, sgst: 0, igst: 0
    };

    const allDispatches = [];
    const allPayments = [];

    customerBookings.forEach(b => {
      totalInvoiceAmount += parseFloat(b.total) || 0;

      const payments = b.payments || [];
      totalPaid += payments.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
      allPayments.push(...payments);

      const e = b.extra_charges || {};
      const base = parseFloat(b.total) || 0;

      extraSummary.pf += (parseFloat(e.packing_percent) || 0) * 0.01 * base;
      extraSummary.taxable += parseFloat(e.taxable_value) || 0;
      extraSummary.discount += (parseFloat(e.additional_discount) || 0) * 0.01 * base;

      const netBeforeTax = base + extraSummary.pf + extraSummary.taxable - extraSummary.discount;
      if (e.apply_igst) {
        extraSummary.igst += netBeforeTax * 0.18;
      } else if (e.apply_cgst && e.apply_sgst) {
        extraSummary.cgst += netBeforeTax * 0.09;
        extraSummary.sgst += netBeforeTax * 0.09;
      }

      allDispatches.push(...(b.dispatch_logs || []));
    });

    const ledgerRows = [];

    allDispatches.forEach((log, i) => {
      const price = parseFloat(log.price_per_box) || 0;
      const discount = parseFloat(log.discount_percent) || 0;
      const effPrice = price - (price * discount / 100);
      const amount = effPrice * (log.dispatched_qty || 0);

      ledgerRows.push({
        slNo: i + 1,
        desc: `${log.product_name || "N/A"}`,
        qty: log.dispatched_qty || "",
        rate: effPrice.toFixed(2),
        debit: amount.toFixed(2),
        credit: "",
        date: new Date(log.dispatched_at).getTime(),
      });
    });

    allPayments.forEach((pay, i) => {
      const idx = ledgerRows.length + i + 1;
      ledgerRows.push({
        slNo: idx,
        desc: `Payment (${pay.payment_method || "N/A"})`,
        qty: "",
        rate: "",
        debit: "",
        credit: parseFloat(pay.amount_paid || 0).toFixed(2),
        date: new Date(pay.transaction_date).getTime(),
      });
    });

    ledgerRows.sort((a, b) => a.date - b.date);

    const totalDispatchedQty = allDispatches.reduce((s, l) => s + (l.dispatched_qty || 0), 0);
    const totalDebit = ledgerRows.reduce((s, r) => s + parseFloat(r.debit || 0), 0);
    const totalCredit = totalPaid;

    const finalBalance = totalInvoiceAmount - totalPaid;
    const isOutstanding = finalBalance > 0;

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ledger – ${selectedBooking.customer_name}</title>
<style>
  body{font-family:Arial,sans-serif;margin:20px;}
  table{width:100%;border-collapse:collapse;margin-top:15px;}
  th,td{border:1px solid #000;padding:6px;text-align:center;font-size:9pt;}
  th{background:#dcdcdc;}
  .debit{color:#d00;}
  .credit{color:#080;}
  .total{font-weight:bold;background:#c8c8c8;}
  .balance{font-size:11pt;}
</style>
</head><body>
<h2 style="text-align:center;">Customer Ledger (Invoice-Based)</h2>
<p><strong>Customer:</strong> ${selectedBooking.customer_name}</p>

<table>
  <thead><tr><th>Sl.No</th><th>Description</th><th>Dispatch</th><th>Rate</th><th>Date</th><th>Debit</th><th>Credit</th></tr></thead>
  <tbody>
    ${ledgerRows.map(r => `
      <tr>
        <td>${r.slNo}</td>
        <td style="text-align:left;">${r.desc}</td>
        <td>${r.qty}</td>
        <td>${r.rate}</td>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td class="debit">${r.debit ? "₹"+r.debit : ""}</td>
        <td class="credit">${r.credit ? "₹"+r.credit : ""}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<p style="margin-top:15px;">
  <strong>Invoice Total (incl. P&F, Taxes):</strong> <span class="debit">₹${totalInvoiceAmount.toFixed(2)}</span><br>
  <strong>Total Paid:</strong> <span class="credit">₹${totalPaid.toFixed(2)}</span><br>
  ${extraSummary.taxable > 0 ? `<span>Taxable Amount: <span class="debit">₹${extraSummary.taxable.toFixed(2)}</span></span><br>` : ""}
  ${extraSummary.pf > 0 ? `<span>P&amp;F: <span class="debit">₹${extraSummary.pf.toFixed(2)}</span></span><br>` : ""}
  ${extraSummary.cgst > 0 ? `<span>CGST @ 9%: <span class="debit">₹${extraSummary.cgst.toFixed(2)}</span></span><br>` : ""}
  ${extraSummary.sgst > 0 ? `<span>SGST @ 9%: <span class="debit">₹${extraSummary.sgst.toFixed(2)}</span></span><br>` : ""}
  ${extraSummary.igst > 0 ? `<span>IGST @ 18%: <span class="debit">₹${extraSummary.igst.toFixed(2)}</span></span><br>` : ""}
  ${extraSummary.discount > 0 ? `<span>Discount: <span class="credit">-₹${extraSummary.discount.toFixed(2)}</span></span><br>` : ""}
</p>

<table class="total" style="margin-top:15px;">
  <tr>
    <td style="text-align:left;">Total Invoice</td>
    <td colspan="4"></td>
    <td class="debit">₹${totalInvoiceAmount.toFixed(2)}</td>
    <td class="credit">₹${totalPaid.toFixed(2)}</td>
  </tr>
  <tr>
    <td colspan="5" style="text-align:left;" class="balance">Balance Due (from Invoices)</td>
    <td colspan="2" style="text-align:center;" class="${isOutstanding ? 'debit' : 'credit'}">
      ₹${Math.abs(finalBalance).toFixed(2)} ${isOutstanding ? "(Outstanding)" : "(Advance)"}
    </td>
  </tr>
</table>

${allPayments.length ? `
<h3 style="margin-top:25px;">Payment Details</h3>
<table>
  <thead><tr><th>Sl.No</th><th>Type</th><th>Bank</th><th>Paid to</th><th>Date</th><th>Amount</th></tr></thead>
  <tbody>
    ${allPayments.map((p,i) => `
      <tr><td>${i+1}</td><td>${p.payment_method || "N/A"}</td><td>${p.bank_name || "N/A"}</td>
          <td>${p.admin_username || "N/A"}</td><td>${new Date(p.transaction_date).toLocaleDateString()}</td>
          <td class="credit">₹${parseFloat(p.amount_paid || 0).toFixed(2)}</td></tr>
    `).join('')}
  </tbody>
</table>
` : ""}

<p style="margin-top:30px;text-align:center;font-size:8pt;">
  Thank you for your business! • Terms: Payment due within 30 days.
</p>
</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 pt-16 md:p-6 md:ml-64 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Customer Ledger
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-center">
              {error}
            </div>
          )}

          <div className="relative max-w-md mx-auto mb-6">
            <input
              type="text"
              placeholder="Search Bill No or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.length === 0 ? (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                    No ledger entries found.
                  </p>
                ) : (
                  paginated.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => openModal(b)}
                      className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          #{b.bill_number}
                        </h3>
                        <FaCalendarAlt className="text-gray-500" />
                      </div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {b.customer_name}
                      </p>

                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-600 font-semibold">Invoice Total:</span>
                          <span className="text-green-600">₹{parseFloat(b.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-semibold">Paid:</span>
                          <span className="text-blue-600">₹{parseFloat(b.paid || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span className="text-white">
                            Balance
                          </span>
                          <span className={b.balance >= 0 ? "text-red-600" : "text-green-600"}>
                            ₹{Math.abs(b.total).toFixed(2)-Math.abs(b.paid).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {b.dispatch_logs.length > 0 && (
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <FaTruck className="mr-1" />
                          {b.dispatch_logs.length} dispatch{b.dispatch_logs.length > 1 ? 'es' : ''}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedBooking}
        onRequestClose={closeModal}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 my-8 outline-none overflow-hidden"
        overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      >
        {selectedBooking && (
          <div className="p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ledger: #{selectedBooking.bill_number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={printLedger}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <FaPrint /> Print
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  x
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-lg mb-2 text-green-600">Invoice Summary</h3>
                <table className="w-full text-sm border text-black dark:text-white">
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2 font-semibold">Invoice Total:</td>
                      <td className="p-2 text-right text-green-600">₹{parseFloat(selectedBooking.total || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-semibold">Total Paid:</td>
                      <td className="p-2 text-right text-blue-600">₹{parseFloat(selectedBooking.paid || 0).toFixed(2)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-semibold">Balance:</td>
                      <td className={`p-2 text-right font-bold ${selectedBooking.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{Math.abs(selectedBooking.total - selectedBooking.paid).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 text-blue-600">Dispatch Details</h3>
                {selectedBooking.dispatch_logs.length === 0 ? (
                  <p className="text-gray-500 italic">No dispatches recorded</p>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-sm border border-gray-300 rounded-lg">
                        <thead className="border border-gray-300 text-white">
                          <tr className="border-r border-white">
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Product</th>
                            <th className="p-3 text-center">Cases</th>
                            <th className="p-3 text-right font-bold">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-black dark:text-white">
                          {selectedBooking.dispatch_logs.map((d, i) => {
                            // THE FIX: Use price_per_box (from your actual data)
                            const rate = parseFloat(d.price_per_box) || 0;
                            const qty = parseFloat(d.dispatched_qty) || 0;
                            const discount = parseFloat(d.discount_percent) || 0;
                            const amount = rate * qty * (1 - discount / 100);

                            return (
                              <tr key={i} className="transition">
                                <td className="p-3 text-xs">
                                  {new Date(d.dispatched_at).toLocaleDateString("en-IN")}
                                </td>
                                <td className="p-3 font-medium">
                                  {d.product_name}
                                  {d.brand && <span className="text-blue-600 text-xs ml-2">({d.brand})</span>}
                                </td>
                                <td className="p-3 text-center font-semibold">{d.dispatched_cases || 0}</td>
                                <td className="p-3 text-right font-bold text-green-600">
                                  ₹{amount.toFixed(2)}
                                  {discount > 0 && <div className="text-xs text-orange-600">(-{discount}%)</div>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-green-200">
                      <p className="text-right text-md font-bold text-green-700">
                        Total Dispatched Value:{" "}
                        <span className="text-md">
                          ₹
                          {selectedBooking.dispatch_logs
                            .reduce((total, d) => {
                              const rate = parseFloat(d.price_per_box) || 0;
                              const qty = parseFloat(d.dispatched_qty) || 0;
                              const discount = parseFloat(d.discount_percent) || 0;
                              return total + rate * qty * (1 - discount / 100);
                            }, 0)
                            .toFixed(2)
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">Payments (Credit)</h3>
              {selectedBooking.payments.length === 0 ? (
                <p className="text-gray-500">No payments</p>
              ) : (
                <>
                  <table className="w-full text-sm border text-black dark:text-white">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Method</th>
                        <th className="p-2 text-left">Bank</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.payments.map((p, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{new Date(p.transaction_date).toLocaleDateString()}</td>
                          <td className="p-2">{p.payment_method}</td>
                          <td className="p-2">{p.bank_name || "-"}</td>
                          <td className="p-2 text-right">₹{parseFloat(p.amount_paid).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}