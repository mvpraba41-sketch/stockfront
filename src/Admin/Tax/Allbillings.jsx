import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import Modal from 'react-modal';
import { FaEye, FaDownload, FaTimes, FaSpinner, FaSearch } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceTemplate from '../../Component/InvoiceTemplate';
import { createRoot } from 'react-dom/client';
import { API_BASE_URL } from '../../../Config';

Modal.setAppElement("#root");

export default function AllBillings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const [states, setStates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const hiddenContainerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bookingsRes, statesRes, companiesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/bookings`),
          fetch(`${API_BASE_URL}/api/states`),
          fetch(`${API_BASE_URL}/api/companies`)
        ]);

        const bookingsData = await bookingsRes.json();
        const statesData = await statesRes.json();
        const companiesData = await companiesRes.json();

        const sorted = bookingsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setBookings(sorted);
        setFilteredBookings(sorted);
        setStates(statesData);
        setCompanies(Array.isArray(companiesData) ? companiesData : [companiesData]);
      } catch (err) {
        console.error(err);
        alert('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [API_BASE_URL]);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter(b =>
      b.customer_name?.toLowerCase().includes(query) ||
      b.bill_no?.toLowerCase().includes(query) ||
      b.type?.toLowerCase().includes(query)
    );
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [searchQuery, bookings]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const viewBill = async (booking) => {
    setSelectedBill(booking);
    setShowModal(true);
    setLoadingPDF(true);
    setPdfBlobUrl('');

    const billCompany = companies.find(c =>
      c.company_name?.trim().toUpperCase() === (booking.company_name || '').trim().toUpperCase()
    ) || companies[0];
    setSelectedCompany(billCompany);

    // Create hidden container once
    if (!hiddenContainerRef.current) {
      hiddenContainerRef.current = document.createElement('div');
      hiddenContainerRef.current.style.position = 'absolute';
      hiddenContainerRef.current.style.left = '-9999px';
      hiddenContainerRef.current.style.top = '0';
      hiddenContainerRef.current.style.width = '210mm';
      hiddenContainerRef.current.style.minHeight = '297mm';
      hiddenContainerRef.current.style.padding = '20px';
      hiddenContainerRef.current.style.background = 'white';
      hiddenContainerRef.current.style.boxSizing = 'border-box';
      document.body.appendChild(hiddenContainerRef.current);
    }

    // Clear previous content
    hiddenContainerRef.current.innerHTML = '';

    // Create new React root and render template
    const root = createRoot(hiddenContainerRef.current);
    root.render(
      <InvoiceTemplate
        booking={booking}
        company={billCompany || {}}
        states={states}
        billDate={booking.created_at}
      />
    );

    // Save root reference for cleanup
    rootRef.current = root;

    // Wait for rendering to complete, then generate PDF
    setTimeout(async () => {
      try {
        if (!hiddenContainerRef.current) {
          setLoadingPDF(false);
          return;
        }

        const canvas = await html2canvas(hiddenContainerRef.current, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: hiddenContainerRef.current.scrollWidth,
          height: hiddenContainerRef.current.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err) {
        console.error('PDF generation failed:', err);
        alert('Failed to generate PDF preview');
      } finally {
        setLoadingPDF(false);
      }
    }, 800); // Increased delay for reliable rendering
  };

  const downloadPDF = () => {
    if (!pdfBlobUrl || !selectedBill) {
      alert('PDF not ready yet. Please wait...');
      return;
    }
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${selectedBill.bill_no.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    link.click();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Cleanup when modal closes
  useEffect(() => {
    if (!showModal) {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl('');
      }
    }
  }, [showModal, pdfBlobUrl]);

  // Final cleanup on component unmount
  useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      if (hiddenContainerRef.current?.parentNode) {
        hiddenContainerRef.current.parentNode.removeChild(hiddenContainerRef.current);
        hiddenContainerRef.current = null;
      }
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading Bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-16 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
            All Bookings
          </h2>

          <div className="mb-6 relative max-w-md mx-auto">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by customer, bill no, or type (tax/supply)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {paginatedBookings.map(b => (
              <div key={b.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
                    {b.customer_name || '—'}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.type === 'tax'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {b.type}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Bill: <span className="font-mono">{b.bill_no}</span>
                </p>
                <p className="text-xs text-sky-500 truncate">
                  {b.through || 'DIRECT'} → {b.destination || b.customer_place || '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(b.created_at)}
                </p>
                <button
                  onClick={() => viewBill(b)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-1 transition"
                >
                  <FaEye className="h-4 w-4" /> View
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => goToPage(page)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 outline-none overflow-hidden"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        {selectedBill && (
          <div className="flex flex-col h-full max-h-screen">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedBill.type === 'tax' ? 'Tax Invoice' : 'Bill of Supply'} - {selectedBill.bill_no}
              </h2>
              <div className="flex gap-2">
                <button onClick={downloadPDF}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1">
                  <FaDownload className="h-4 w-4" /> Download
                </button>
                <button onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1">
                  <FaTimes className="h-4 w-4" /> Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 md:p-4 overflow-auto">
              {loadingPDF ? (
                <div className="flex items-center justify-center h-64">
                  <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                </div>
              ) : pdfBlobUrl ? (
                <embed src={pdfBlobUrl} type="application/pdf" className="w-full h-full border-0" style={{ minHeight: '600px' }} />
              ) : (
                <p className="text-center text-red-600">Failed to generate PDF</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}