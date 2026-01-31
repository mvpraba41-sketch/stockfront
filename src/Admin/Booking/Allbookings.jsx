import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import Modal from 'react-modal';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaDownload, FaTimes, FaSpinner, FaSearch } from 'react-icons/fa';

Modal.setAppElement("#root");

export default function AllBookings() {
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

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/booking`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));
        setBookings(sorted);
        setFilteredBookings(sorted);
      })
      .catch(() => alert('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter(b =>
      b.customer_name?.toLowerCase().includes(query)
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
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const viewBill = async (booking) => {
    setSelectedBill(booking);
    setShowModal(true);
    setLoadingPDF(true);
    setPdfBlobUrl('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/booking/pdf/${booking.id}`);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      alert('Could not load PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfBlobUrl || !selectedBill) {
      alert('PDF not ready yet. Please wait...');
      return;
    }
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${selectedBill.bill_number || 'bill'}.pdf`;
    link.click();
  };

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
              placeholder="Search by customer name..."
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
              <div
                key={b.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
                  {b.customer_name}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Bill: <span className="font-mono">{b.bill_number}</span>
                </p>
                <p className="text-xs text-sky-500 truncate">
                  {b.from} to {b.to}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(b.bill_date)}
                </p>
                <button
                  onClick={() => viewBill(b)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-1 transition"
                >
                  <FaEye className="h-3 w-3 md:h-4 md:w-4" /> View
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
        overlayClassName="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4"
        closeTimeoutMS={200}
      >
        {selectedBill && (
          <div className="flex flex-col h-full max-h-screen">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                Bill: {selectedBill.bill_number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={downloadPDF}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1 transition"
                >
                  <FaDownload className="h-3 w-3" /> Download
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1 transition"
                >
                  <FaTimes className="h-3 w-3" /> Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 md:p-4 overflow-auto">
              {loadingPDF ? (
                <div className="flex items-center justify-center h-64">
                  <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                </div>
              ) : pdfBlobUrl ? (
                <embed
                  src={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-96 border-0"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <p className="text-center text-red-600">Failed to load PDF</p>
              )}
            </div>

            {pdfBlobUrl && (
              <div className="p-2 text-center text-xs text-gray-500">
                <a href={pdfBlobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Open in new tab (if PDF doesn't show)
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}