import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import * as XLSX from 'xlsx';
import { FaDownload, FaExclamationTriangle, FaEye, FaSpinner } from 'react-icons/fa';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export default function StockAnalysis() {
  const [data, setData] = useState({
    allRows: [],
    lowStock: [],
    godownSummary: [],
    productSummary: [],
    grandTotal: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockModal, setLowStockModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stock-analysis`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(setData)
      .catch(e => setError(e.message || e))
      .finally(() => setLoading(false));
  }, []);

  const capitalize = (s) => {
    if (!s || typeof s !== 'string') return '';
    return s
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const currentWS = XLSX.utils.json_to_sheet(
      data.allRows.map((r, i) => ({
        '#': i + 1,
        Godown: capitalize(r.godown_name),
        Type: capitalize(r.product_type),
        Product: r.productname,
        Brand: capitalize(r.brand),
        Agent: r.agent_name,
        Cases: r.cases,
        'Per Case': r.per_case,
        'Total Qty': r.total_qty,
      }))
    );
    XLSX.utils.book_append_sheet(wb, currentWS, 'Current Stock');

    const lowWS = XLSX.utils.json_to_sheet(
      data.lowStock.map((r, i) => ({
        '#': i + 1,
        Type: capitalize(r.product_type),
        Product: r.productname,
        Brand: capitalize(r.brand),
        Agent: r.agent_name,
        'Total Cases': r.total_cases,
      }))
    );
    XLSX.utils.book_append_sheet(wb, lowWS, 'Low Stock');

    const godownWS = XLSX.utils.json_to_sheet(
      data.godownSummary.map((r, i) => ({
        '#': i + 1,
        Godown: capitalize(r.godown_name),
        'Total Cases': r.total_cases,
      }))
    );
    XLSX.utils.book_append_sheet(wb, godownWS, 'Godown Totals');

    const productWS = XLSX.utils.json_to_sheet(
      data.productSummary.map((r, i) => ({
        '#': i + 1,
        Type: capitalize(r.product_type),
        Product: r.productname,
        Brand: capitalize(r.brand),
        Agent: r.agent_name,
        'Total Cases': r.total_cases,
        'Total Qty': r.total_qty,
      }))
    );
    XLSX.utils.book_append_sheet(wb, productWS, 'Product Totals');

    XLSX.writeFile(wb, `Stock_Analysis_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-5xl text-blue-600 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-600 text-lg mobile:text-base">{error}</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-20 mobile:pt-16">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex mobile:flex-col mobile:gap-3 justify-between items-center mb-6 mobile:mb-4">
            <h1 className="text-2xl mobile:text-xl font-bold text-gray-900 dark:text-white">
              Stock Analysis Dashboard
            </h1>
            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 mobile:px-3 py-2 mobile:py-1.5 rounded-md font-medium text-sm mobile:text-xs shadow hover:from-indigo-600 hover:to-purple-700"
            >
              <FaDownload className="mobile:h-3 mobile:w-3" /> Download Report
            </button>
          </div>

          {data.lowStock.length > 0 && (
            <div className="mb-8 mobile:mb-6 p-5 mobile:p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800-dark-800 rounded-lg">
              <div className="flex mobile:flex-col mobile:gap-2 items-start justify-between mb-3 mobile:mb-2">
                <div className="flex items-center gap-3 mobile:gap-2">
                  <FaExclamationTriangle className="text-red-600 text-xl mobile:text-lg" />
                  <h2 className="text-lg mobile:text-base font-semibold text-red-800 dark:text-red-300">
                    Low Stock Alert
                  </h2>
                </div>
                <button
                  onClick={() => setLowStockModal(true)}
                  className="flex items-center gap-1 text-red-700 dark:text-red-300 hover:underline text-sm mobile:text-xs"
                >
                  <FaEye className="mobile:h-3 mobile:w-3" /> View
                </button>
              </div>
              <p className="text-sm mobile:text-xs text-black dark:text-white">
                {`${data.lowStock.length} product(s) with less than 3 cases total.`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mobile:gap-4 mb-8 mobile:mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 mobile:p-4 rounded-lg text-white">
              <p className="text-sm mobile:text-xs opacity-80">Products</p>
              <p className="text-3xl mobile:text-2xl font-bold">{data.grandTotal.unique_products}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 mobile:p-4 rounded-lg text-white">
              <p className="text-sm mobile:text-xs opacity-80">Total Cases</p>
              <p className="text-3xl mobile:text-2xl font-bold">{data.grandTotal.total_cases}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 mobile:p-4 rounded-lg text-white">
              <p className="text-sm mobile:text-xs opacity-80">Total Quantity</p>
              <p className="text-3xl mobile:text-2xl font-bold">{data.grandTotal.total_quantity}</p>
            </div>
          </div>

          <div className="mb-8 mobile:mb-6">
            <h2 className="text-xl mobile:text-lg font-semibold mb-4 mobile:mb-3 text-gray-800 dark:text-gray-200">
              Total Cases per Godown
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">No</th>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">Godown</th>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">Total Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.godownSummary.map((g, i) => (
                      <tr key={i}>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-black dark:text-white">{i + 1}</td>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-black dark:text-white">{capitalize(g.godown_name)}</td>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-indigo-600 dark:text-indigo-400">
                          {g.total_cases}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl mobile:text-lg font-semibold mb-4 mobile:mb-3 text-gray-800 dark:text-gray-200">
              Total Cases per Product
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">No</th>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">Product</th>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">Brand</th>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">Agent</th>
                      <th className="px-4 mobile:px-3 py-3 mobile:py-2 text-left hundred:text-lg mobile:text-[10px] text-gray-500 dark:text-gray-300 uppercase">Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.productSummary.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-black dark:text-white">{i + 1}</td>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-black dark:text-white">{p.productname}</td>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-black dark:text-white">{capitalize(p.brand)}</td>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-sky-300">{p.agent_name}</td>
                        <td className="px-4 mobile:px-3 py-3 mobile:py-2 hundred:text-lg mobile:text-xs text-green-600 dark:text-green-400">
                          {p.total_cases}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <Modal
            isOpen={lowStockModal}
            onRequestClose={() => setLowStockModal(false)}
            className="fixed inset-0 flex items-center justify-center p-4 mobile:p-2"
            overlayClassName="fixed inset-0 bg-black/50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mobile:p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg mobile:text-base font-bold mb-4 mobile:mb-3 flex items-center gap-2 text-black dark:text-white">
                <FaExclamationTriangle className="text-red-600 text-lg mobile:text-base" />
                Low Stock Products
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                      <th className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">Brand</th>
                      <th className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">Agent</th>
                      <th className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-left text-xs mobile:text-[10px] font-medium text-gray-500 dark:text-gray-300 uppercase">Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.lowStock.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-sm mobile:text-xs text-black dark:text-white">{item.productname}</td>
                        <td className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-sm mobile:text-xs text-black dark:text-white">{capitalize(item.brand)}</td>
                        <td className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-sm mobile:text-xs text-sky-300">{item.agent_name}</td>
                        <td className="px-4 mobile:px-3 py-2 mobile:py-1.5 text-sm mobile:text-xs font-bold text-red-600">
                          {item.total_cases}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 mobile:mt-3 text-right">
                <button
                  onClick={() => setLowStockModal(false)}
                  className="px-4 mobile:px-3 py-2 mobile:py-1.5 bg-gray-300 dark:bg-gray-700 rounded text-sm mobile:text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}