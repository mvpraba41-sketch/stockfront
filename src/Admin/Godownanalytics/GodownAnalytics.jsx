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

const capitalize = str => str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

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
      <div className="flex min-h-screen bg-[#0a0c10]">
        <Sidebar /><Logout />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20">
          <FaSpinner className="animate-spin text-[#3fedd8] text-4xl" />
          <p className="text-xs uppercase tracking-widest text-white/40">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[#0a0c10]">
        <Sidebar /><Logout />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-red-400 text-center">{error || 'No data'}</p>
        </div>
      </div>
    );
  }

  const { chart, totals, topProducts, agentPerformance } = data;

  if (!chart || chart.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#0a0c10]">
        <Sidebar /><Logout />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-white/40 text-sm">No godowns found.</p>
        </div>
      </div>
    );
  }

  const currentGodown = chart[page];
  const totalPages = chart.length;
  const godownId = Number(currentGodown.godownId);
  const currentTotals = totals.find(t => t.godownId === godownId) || { intake: 0, outtake: 0 };

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'rgba(255,255,255,0.55)', font: { size: 12 } },
      },
    },
  };

  const barData = {
    labels: currentGodown.labels,
    datasets: [
      { label: 'In', data: currentGodown.intake, backgroundColor: 'rgba(63,237,216,0.7)', borderRadius: 6 },
      { label: 'Out', data: currentGodown.outtake, backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6 },
    ],
  };

  const pieData = {
    labels: currentGodown.productNames,
    datasets: [
      {
        label: 'In',
        data: currentGodown.productIntake,
        backgroundColor: ['#3fedd8','#34d399','#6ee7b7','#86efac','#bbf7d0','#22d3ee','#67e8f9','#99f6e4','#ccfbfe'].slice(0, currentGodown.productNames.length),
        borderWidth: 0,
      },
      {
        label: 'Out',
        data: currentGodown.productOuttake,
        backgroundColor: ['#ef4444','#f87171','#fca5a5','#fecaca','#fee2e2','#f97316','#fb923c','#fdba74','#fed7aa'].slice(0, currentGodown.productNames.length),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 pt-20 overflow-auto pb-10">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-0.5">Analytics</p>
              <h1 className="text-2xl font-black text-white">
                {capitalize(currentGodown.godownName)}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition"
              >
                <FaArrowLeft className="text-xs" /> Back
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 bg-[#3fedd8]/10 border border-[#3fedd8]/20 text-[#3fedd8] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3fedd8]/18 transition"
              >
                <FaDownload className="text-xs" /> Export All
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            {['day', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition border ${
                  period === p
                    ? 'bg-[#3fedd8] text-[#0a0c10] border-[#3fedd8]'
                    : 'bg-transparent text-white/55 border-white/15 hover:border-white/30'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total In', value: currentTotals.intake, color: 'text-[#3fedd8]' },
              { label: 'Total Out', value: currentTotals.outtake, color: 'text-red-400' },
              { label: 'Net Stock', value: currentTotals.intake - currentTotals.outtake, color: 'text-sky-400' },
            ].map(card => (
              <div key={card.label} className="bg-[#111318] border border-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs mb-1">{card.label}</p>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Intake vs Outtake</p>
              <div className="h-64">
                <Bar
                  data={barData}
                  options={{
                    ...chartDefaults,
                    scales: {
                      y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                      x: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Product-wise Flow</p>
              <div className="h-64">
                <Pie
                  data={pieData}
                  options={{
                    ...chartDefaults,
                    plugins: {
                      legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.45)', font: { size: 11 }, boxWidth: 12 } },
                      tooltip: {
                        callbacks: {
                          label: ctx => {
                            const value = ctx.raw || 0;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${value} (${pct}%)`;
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
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111318] border border-white/10 text-white/60 hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/35">Godown</p>
              <p className="text-lg font-black text-[#3fedd8]">{page + 1} <span className="text-white/30 font-normal">/ {totalPages}</span></p>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111318] border border-white/10 text-white/60 hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>

          {/* Global Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Products */}
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Top 5 Products (Outtake)</p>
              {topProducts.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No data</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg">
                      <span className="text-white text-sm font-medium">{i + 1}. {p.product}</span>
                      <span className="text-red-400 font-bold text-sm">{p.cases}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Performance */}
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Agent Performance</p>
              {agentPerformance.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No data</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Agent', 'Added', 'Taken'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium border-b border-white/8">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {agentPerformance.map((a, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition">
                        <td className="px-3 py-3 text-white text-sm font-medium">{a.agent}</td>
                        <td className="px-3 py-3 text-[#3fedd8] font-bold text-sm">{a.added}</td>
                        <td className="px-3 py-3 text-red-400 font-bold text-sm">{a.taken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}