import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../Config";
import Sidebar from "../Sidebar/Sidebar";
import Logout from "../../Admin/Logout";
import Modal from "react-modal";
import {
  FaSearch,
  FaTruck,
  FaCheckCircle,
  FaTimes,
  FaDownload,
} from "react-icons/fa";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

Modal.setAppElement("#root");

const pdfStyles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#fff" },
  mainTitle: { fontSize: 36, textAlign: "center", marginBottom: 6, fontWeight: "bold", color: "#b91c1c" },
  tagline: { fontSize: 11, textAlign: "center", marginBottom: 30, color: "#666", fontStyle: "italic" },

  headerSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  customerInfo: { flex: 1 },
  challanInfo: { width: 200, textAlign: "right" },

  label: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  valueBold: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  value: { fontSize: 11, color: "#444", marginBottom: 3 },

  bold: { fontWeight: "bold" },
  boldRed: { fontWeight: "bold", color: "#dc2626" },

  table: { marginTop: 20, border: "1px solid #000" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1e3a8a", color: "white" },
  tableRow: { flexDirection: "row", minHeight: 38, alignItems: "center" },
  th: { padding: 10, fontSize: 10, fontWeight: "bold", textAlign: "center" },
  td: { padding: 8, fontSize: 10, textAlign: "center", borderBottom: "0.5px solid #ccc" },

  totalBox: { marginTop: 30, padding: 16, backgroundColor: "#fef3c7", borderRadius: 10, alignItems: "center" },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#92400e" },

  transportBox: { marginTop: 35, padding: 18, backgroundColor: "#f0f9ff", borderRadius: 10, fontSize: 12, border: "1px dashed #3b82f6" },
  transportTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 10, color: "#1e40af" },

  footer: { position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#666" },
});

const DeliveryChallanPDF = ({ booking, dispatches }) => {
  const totalCases = dispatches.reduce((s, d) => s + d.cases, 0);
  const totalQty = dispatches.reduce((s, d) => s + d.qty, 0);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.mainTitle}>DELIVERY CHALLAN</Text>
        <Text style={pdfStyles.tagline}>Goods Once Sold Will Not Be Taken Back or Exchanged</Text>

        <View style={pdfStyles.headerSection}>
          <View style={pdfStyles.customerInfo}>
            <Text style={pdfStyles.label}>To:</Text>
            <Text style={pdfStyles.valueBold}>{booking.customer_name}</Text>
            {booking.address && <Text style={pdfStyles.value}>{booking.address}</Text>}
            {booking.gstin && <Text style={pdfStyles.value}>GSTIN: {booking.gstin || 'N/A'}</Text>}
          </View>

          <View style={pdfStyles.challanInfo}>
            <Text style={{ fontSize: 13 }}>
              Date: <Text style={pdfStyles.bold}>{new Date().toLocaleDateString("en-IN")}</Text>
            </Text>
            <Text style={{ fontSize: 11,marginTop: 8 }}>
              Challan No: <Text style={pdfStyles.bold}>DC-{booking.bill_number}</Text>
            </Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeaderRow}>
            <Text style={[pdfStyles.th, { width: "7%" }]}>S.No</Text>
            <Text style={[pdfStyles.th, { width: "20%" }]}>Brand</Text>
            <Text style={[pdfStyles.th, { width: "38%" }]}>Product Description</Text>
            <Text style={[pdfStyles.th, { width: "11%" }]}>Cases</Text>
            <Text style={[pdfStyles.th, { width: "11%" }]}>Per Case</Text>
            <Text style={[pdfStyles.th, { width: "11%" }]}>Qty</Text>
            <Text style={[pdfStyles.th, { width: "22%" }]}>From Godown</Text>
          </View>

          {dispatches.map((item, i) => (
            <View style={pdfStyles.tableRow} key={i}>
              <Text style={[pdfStyles.td, { width: "7%" }]}>{i + 1}</Text>
              <Text style={[pdfStyles.td, { width: "20%" }]}>{item.brand}</Text>
              <Text style={[pdfStyles.td, { width: "38%", textAlign: "center", paddingLeft: 10 }]}>
                {item.product_name}
              </Text>
              <Text style={[pdfStyles.td, { width: "11%" }]}>{item.cases}</Text>
              <Text style={[pdfStyles.td, { width: "11%" }]}>{item.per_case}</Text>
              <Text style={[pdfStyles.td, { width: "11%" }]}>{item.qty}</Text>
              <Text style={[pdfStyles.td, { width: "22%", color: "#dc2626", fontWeight: "bold" }]}>
                {item.godown || "Main Godown"}
              </Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalBox}>
          <Text style={pdfStyles.totalText}>
            Total Cases: {totalCases}  |  Total Quantity: {totalQty}
          </Text>
        </View>

        <View style={pdfStyles.transportBox}>
          <Text style={pdfStyles.transportTitle}>Transport Details</Text>
          <Text style={{ marginTop: 2 }}>From      : {booking.from || "SIVAKASI"}</Text>
          <Text style={{ marginTop: 2 }}>To        : {booking.to || "N/A"}</Text>
          <Text style={{ marginTop: 2 }}>Through   : <Text style={pdfStyles.boldRed}>{booking.through || "Own Transport"}</Text></Text>
          {booking.lr_number && (
            <Text style={{ marginTop: 2 }}>LR Number : <Text style={pdfStyles.boldRed}>{booking.lr_number || 'N/A'}</Text></Text>
          )}
        </View>

        <Text style={pdfStyles.footer}>
          This is a computer-generated Delivery Challan • Subject to Sivakasi Jurisdiction
        </Text>
      </Page>
    </Document>
  );
};

const PAGE_SIZE = 9;

export default function Dispatch() {
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("PENDING");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [caseDispatches, setCaseDispatches] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/booking`),
        ]);

        const logRes = await axios.get(`${API_BASE_URL}/api/dispatch_logs/all`);

        const dispatchedMapGlobal = {};

        logRes.data.forEach(log => {
          const key = `${log.booking_id}-${log.product_index}`;
          dispatchedMapGlobal[key] = (dispatchedMapGlobal[key] || 0) + (log.dispatched_cases || 0);
        });

        const enriched = bookRes.data.map((b) => {
          const items = typeof b.items === "string" ? JSON.parse(b.items || "[]") : b.items || [];
          
          const dispatchedMap = {};
          items.forEach((p, idx) => {
            const key = `${b.id}-${idx}`;
            dispatchedMap[idx] = dispatchedMapGlobal[key] || 0;
          });

          return {
            ...b,
            products: items.map((p, idx) => ({
              ...p,
              productname: p.productname || p.product_name || "Unknown",
              cases: parseInt(p.cases) || 0,
              per_case: parseInt(p.per_case) || 1,
              rate_per_box: parseFloat(p.rate_per_box) || 0,
              discount_percent: parseFloat(p.discount_percent) || 0,
              brand: p.brand || "",
              godown: p.godown || "Main Godown",
            })),
            dispatchedMap,
            through: b.through || "Own Transport",
            lr_number: b.lr_number || null,
            from: b.from || "SIVAKASI",
            to: b.to || "",
          };
        });

        setBookings(enriched);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load bookings & dispatch logs");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTotalCases = (b) => b.products.reduce((s, p) => s + (parseInt(p.cases) || 0), 0);
  const getDispatchedCases = (b) => Object.values(b.dispatchedMap).reduce((s, v) => s + v, 0);
  const isPending = (b) => getDispatchedCases(b) < getTotalCases(b);
  const isCompleted = (b) => getDispatchedCases(b) >= getTotalCases(b);

  const filtered = bookings
    .filter((b) => (tab === "PENDING" ? isPending(b) : isCompleted(b)))
    .filter((b) =>
      [b.bill_number, b.customer_name, b.through, b.lr_number].some((f) =>
        f?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setCaseDispatches({});
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setCaseDispatches({});
    setIsModalOpen(false);
  };

  const handleDispatch = async () => {
    if (!selectedBooking) return;

    const toDispatch = selectedBooking.products
      .map((p, idx) => {
        const already = selectedBooking.dispatchedMap[idx] || 0;
        const remaining = parseInt(p.cases) - already;
        const input = parseInt(caseDispatches[idx]) || 0;
        const cases = Math.min(input, remaining);
        if (cases <= 0) return null;

        return {
          product_index: idx,
          product_name: p.productname,
          brand: p.brand || "",
          cases,
          per_case: parseInt(p.per_case || 1),
          qty: cases * parseInt(p.per_case || 1),
          rate_per_box: parseFloat(p.rate_per_box) || 0,
          discount_percent: parseFloat(p.discount_percent) || 0,
          godown: p.godown || "Main Godown",
        };
      })
      .filter(Boolean);

    if (toDispatch.length === 0) {
      setError("Please enter at least one case to dispatch");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_BASE_URL}/api/dispatch`, {
        booking_id: selectedBooking.id,
        dispatches: toDispatch.map(d => ({
          product_index: d.product_index,
          product_name: d.product_name,
          brand: d.brand,
          dispatched_cases: d.cases,
          dispatched_qty: d.qty,
          rate_per_box: d.rate_per_box,
          discount_percent: d.discount_percent,
          godown: d.godown,
        })),
        through: selectedBooking.through || "Own Transport",
        lr_number: selectedBooking.lr_number || null,
      });

      const blob = await pdf(
        <DeliveryChallanPDF
          booking={{
            ...selectedBooking,
            through: selectedBooking.through || "Own Transport",
            lr_number: selectedBooking.lr_number || "Not Specified",
          }}
          dispatches={toDispatch}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DC_${selectedBooking.bill_number}_${selectedBooking.customer_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccess("Dispatched & Challan Generated!");
      setTimeout(() => setSuccess(""), 5000);

      // Update UI
      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id
            ? {
                ...b,
                dispatchedMap: {
                  ...b.dispatchedMap,
                  ...Object.fromEntries(toDispatch.map(d => [d.product_index, (b.dispatchedMap[d.product_index] || 0) + d.cases])),
                },
              }
            : b
        )
      );

      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Dispatch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6 pt-20 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-white flex items-center justify-center gap-3">
            <FaTruck className="text-blue-600" />
            Dispatch Management
          </h1>

          {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-center flex items-center justify-center gap-2"><FaCheckCircle /> {success}</div>}

          <div className="flex justify-center gap-6 mb-8">
            <button
              onClick={() => { setTab("PENDING"); setCurrentPage(1); }}
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${tab === "PENDING" ? "bg-blue-600 text-white shadow-lg" : "bg-gray-200 text-gray-700"}`}
            >
              Pending ({bookings.filter(isPending).length})
            </button>
            <button
              onClick={() => { setTab("COMPLETED"); setCurrentPage(1); }}
              className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${tab === "COMPLETED" ? "bg-green-600 text-white shadow-lg" : "bg-gray-200 text-gray-700"}`}
            >
              Completed ({bookings.filter(isCompleted).length})
            </button>
          </div>

          <div className="relative max-w-2xl mx-auto mb-10">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Bill No, Customer, LR No, Transport..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-6 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none text-lg text-black dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginated.map((b) => {
              const total = getTotalCases(b);
              const done = getDispatchedCases(b);
              const left = total - done;

              return (
                <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-blue-600">#{b.bill_number}</h3>
                    {tab === "COMPLETED" && <FaCheckCircle className="text-3xl text-green-600" />}
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{b.customer_name}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Through:</strong> {b.through || "Own"} | <strong>LR:</strong> {b.lr_number || "—"}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-3xl font-bold text-blue-700">{total}</p>
                      <p className="text-xs text-blue-600">Total</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-3xl font-bold text-green-700">{done}</p>
                      <p className="text-xs text-green-600">Done</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-3xl font-bold text-orange-700">{left}</p>
                      <p className="text-xs text-orange-600">Left</p>
                    </div>
                  </div>

                  {tab === "PENDING" && left > 0 && (
                    <button
                      onClick={() => openModal(b)}
                      className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3"
                    >
                      <FaTruck /> Dispatch Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-12">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-12 h-12 rounded-full font-bold ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full mx-4 my-8 outline-none overflow-y-auto max-h-screen"
        overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      >
        {selectedBooking && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dispatch: #{selectedBooking.bill_number}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes className="text-3xl" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 p-8 rounded-2xl mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{selectedBooking.customer_name}</p>
                  {selectedBooking.address && <p className="text-gray-600 mt-2">{selectedBooking.address}</p>}
                  {selectedBooking.gstin && <p className="text-sm text-gray-500 mt-1">GSTIN: {selectedBooking.gstin}</p>}
                </div>
                <div className="space-y-3 text-lg">
                  <p><strong>Through:</strong> <span className="font-bold text-blue-700">{selectedBooking.through || "Own Transport"}</span></p>
                  <p><strong>LR No:</strong> <span className="font-bold text-red-600">{selectedBooking.lr_number || "Not Specified"}</span></p>
                  <p className="text-sm text-gray-600">
                    From: {selectedBooking.from || "SIVAKASI"} → To: {selectedBooking.to || "-"}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-6">Select Cases to Dispatch</h3>
            <div className="space-y-6">
              {selectedBooking.products.map((p, idx) => {
                const already = selectedBooking.dispatchedMap[idx] || 0;
                const remaining = parseInt(p.cases) - already;

                return (
                  <div key={idx} className="border-2 border-gray-300 rounded-2xl p-6 bg-white hover:border-blue-500 transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xl font-bold text-gray-800">{p.productname}</p>
                        {p.brand && <p className="text-gray-600">Brand: {p.brand}</p>}
                        <p className="text-sm text-gray-500">Per Case: {p.per_case} pcs</p>
                      </div>
                      <div className="text-center mobile:flex mobile:flex-row">
                        <p>Total Cases: <strong className="text-blue-600">{p.cases}</strong></p>
                        <p>Dispatched: <strong className="text-green-600">{already}</strong></p>
                        <p>Remaining: <strong className="text-orange-600">{remaining}</strong></p>
                      </div>
                    </div>

                    {remaining > 0 ? (
                      <div className="mt-6 flex items-center justify-end gap-4">
                        <label className="text-lg font-medium">Cases to Dispatch:</label>
                        <input
                          type="number"
                          min="1"
                          max={remaining}
                          className="w-32 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-bold text-center focus:border-blue-500 outline-none"
                          onChange={(e) => setCaseDispatches({ ...caseDispatches, [idx]: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <p className="mt-6 text-right text-xl font-bold text-green-600">Fully Dispatched</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-4 mt-12">
              <button onClick={closeModal} className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl flex items-center gap-3 disabled:opacity-70"
              >
                {loading ? "Processing..." : <><FaDownload /> Get Challan</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}