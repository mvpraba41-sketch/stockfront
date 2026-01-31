import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaDownload, FaArrowLeft, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function GodownAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/all?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    setPage(0);
  }, [period]);

  const exportExcel = () => {
    window.location.href = `${API_BASE_URL}/api/analytics/all/export`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-5xl text-blue-600 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">Loading Analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-red-600 text-center">{error || 'No data'}</p>
        </div>
      </div>
    );
  }

  const { chart, totals, topProducts, agentPerformance } = data;

  if (!chart || chart.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <Logout />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">No godowns found.</p>
        </div>
      </div>
    );
  }

  const currentGodown = chart[page];
  const totalPages = chart.length;

  const godownId = Number(currentGodown.godownId);
  const currentTotals = totals.find(t => t.godownId === godownId) || { intake: 0, outtake: 0 };

  const barData = {
    labels: currentGodown.labels,
    datasets: [
      { label: 'In', data: currentGodown.intake, backgroundColor: 'rgba(34, 197, 94, 0.7)' },
      { label: 'Out', data: currentGodown.outtake, backgroundColor: 'rgba(239, 68, 68, 0.7)' },
    ],
  };

  const pieData = {
    labels: currentGodown.productNames,
    datasets: [
      {
        label: 'In',
        data: currentGodown.productIntake,
        backgroundColor: [
          '#10b981', '#34d399', '#6ee7b7', '#86efac', '#bbf7d0',
          '#22d3ee', '#67e8f9', '#99f6e4', '#ccfbfe'
        ].slice(0, currentGodown.productNames.length),
      },
      {
        label: 'Out',
        data: currentGodown.productOuttake,
        backgroundColor: [
          '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2',
          '#f97316', '#fb923c', '#fdba74', '#fed7aa'
        ].slice(0, currentGodown.productNames.length),
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 mobile:p-2 pt-16 mobile:pt-14 overflow-x-hidden mb-10">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col mobile:flex-row justify-between items-center mb-6 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:underline flex items-center gap-2 text-sm mobile:text-base"
            >
              <FaArrowLeft /> Back
            </button>

            <h1 className="text-2xl mobile:text-3xl font-extrabold text-gray-900 dark:text-white text-center">
              {currentGodown.godownName.replace(/_/g, ' ')}
            </h1>

            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-3 py-1 mobile:px-4 mobile:py-2 bg-blue-600 text-white text-sm mobile:text-base rounded hover:bg-blue-700"
            >
              <FaDownload /> Export All
            </button>
          </div>

          {/* Period Selector */}
          <div className="mb-6 flex justify-center gap-2 flex-wrap">
            {['day', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 mobile:px-5 mobile:py-2 rounded-full text-sm mobile:text-base font-medium transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 mobile:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-xs mobile:text-sm font-medium text-gray-600 dark:text-gray-300">Total In</h3>
              <p className="text-2xl mobile:text-4xl font-extrabold text-green-600 mt-1">
                {currentTotals.intake}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-800 dark:to-gray-700 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-xs mobile:text-sm font-medium text-gray-600 dark:text-gray-300">Total Out</h3>
              <p className="text-2xl mobile:text-4xl font-extrabold text-red-600 mt-1">
                {currentTotals.outtake}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-xs mobile:text-sm font-medium text-gray-600 dark:text-gray-300">Net Stock</h3>
              <p className="text-2xl mobile:text-4xl font-extrabold text-blue-600 mt-1">
                {currentTotals.intake - currentTotals.outtake}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg mobile:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Intake vs Outtake (Time)
              </h3>
              <div className="h-64 mobile:h-80">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg mobile:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Product-wise Flow
              </h3>
              <div className="h-64 mobile:h-80">
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: ctx => {
                            const label = ctx.label || '';
                            const value = ctx.raw || 0;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mobile:gap-6 mb-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 mobile:p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>

            <div className="text-center">
              <p className="text-xs mobile:text-sm text-gray-600 dark:text-gray-400">Godown</p>
              <p className="text-xl mobile:text-2xl font-bold text-blue-600">
                {page + 1} <span className="text-gray-500">/</span> {totalPages}
              </p>
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 mobile:p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
          </div>

          {/* Global Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg mobile:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Top 5 Products (Outtake)
              </h3>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-sm mobile:text-base text-black dark:text-white">{i + 1}. {p.product}</span>
                      <span className="text-red-600 font-bold text-sm mobile:text-base">{p.cases}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 mobile:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg mobile:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Agent Performance
              </h3>
              {agentPerformance.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs mobile:text-sm text-black dark:text-white">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2 font-medium">Agent</th>
                        <th className="text-center py-2 font-medium">Added</th>
                        <th className="text-center py-2 font-medium">Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentPerformance.map((a, i) => (
                        <tr key={i} className="border-b dark:border-gray-700">
                          <td className="py-2 font-medium">{a.agent}</td>
                          <td className="text-center text-green-600 font-bold">{a.added}</td>
                          <td className="text-center text-red-600 font-bold">{a.taken}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}