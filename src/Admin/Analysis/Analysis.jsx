import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import * as XLSX from 'xlsx';
import { FaDownload, FaExclamationTriangle, FaEye, FaSpinner } from 'react-icons/fa';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .sa-root {
    --bg: #0a0c10;
    --surface: #111318;
    --surface2: #181c24;
    --border: rgba(255,255,255,0.06);
    --border-accent: rgba(99,220,175,0.3);
    --teal: #3fedd8;
    --teal-dim: rgba(63,237,216,0.12);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.12);
    --red: #f87171;
    --red-dim: rgba(248,113,113,0.1);
    --text: #e8eaf0;
    --text-muted: #6b7280;
    --text-dim: #9ca3af;
    font-family: 'DM Mono', monospace;
  }

  .sa-root * { box-sizing: border-box; }

  .sa-page {
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    flex: 1;
    padding: 2rem;
    padding-top: 5rem;
  }

  .sa-inner { max-width: 1200px; margin: 0 auto; }

  .sa-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sa-title {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text);
    line-height: 1;
  }

  .sa-title span {
    display: block;
    font-size: 0.75rem;
    font-family: 'DM Mono', monospace;
    color: var(--text-muted);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    font-weight: 400;
    margin-bottom: 0.4rem;
  }

  .sa-btn-download {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--teal);
    color: #0a0c10;
    border: none;
    padding: 0.65rem 1.4rem;
    border-radius: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: opacity 0.15s, transform 0.15s;
  }

  .sa-btn-download:hover { opacity: 0.85; transform: translateY(-1px); }

  /* Low stock alert */
  .sa-alert {
    background: var(--red-dim);
    border: 1px solid rgba(248,113,113,0.25);
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .sa-alert-left { display: flex; align-items: center; gap: 0.75rem; }

  .sa-alert-icon { color: var(--red); font-size: 1rem; }

  .sa-alert-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--red);
    letter-spacing: -0.01em;
  }

  .sa-alert-count {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    color: rgba(248,113,113,0.7);
    margin-top: 0.15rem;
  }

  .sa-btn-view {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(248,113,113,0.15);
    border: 1px solid rgba(248,113,113,0.3);
    color: var(--red);
    padding: 0.45rem 1rem;
    border-radius: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .sa-btn-view:hover { background: rgba(248,113,113,0.22); }

  /* Stats grid */
  .sa-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 640px) { .sa-stats { grid-template-columns: 1fr; } }

  .sa-stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .sa-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .sa-stat--products::before { background: var(--teal); }
  .sa-stat--cases::before { background: #818cf8; }
  .sa-stat--qty::before { background: var(--amber); }

  .sa-stat-label {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .sa-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .sa-stat--products .sa-stat-value { color: var(--teal); }
  .sa-stat--cases .sa-stat-value { color: #818cf8; }
  .sa-stat--qty .sa-stat-value { color: var(--amber); }

  /* Section */
  .sa-section { margin-bottom: 2.5rem; }

  .sa-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.85rem;
    padding-left: 0.25rem;
  }

  .sa-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  /* Table */
  .sa-table { width: 100%; border-collapse: collapse; }

  .sa-table th {
    padding: 0.75rem 1.25rem;
    text-align: left;
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    font-weight: 400;
  }

  .sa-table td {
    padding: 0.85rem 1.25rem;
    font-size: 0.82rem;
    border-bottom: 1px solid var(--border);
    color: var(--text-dim);
  }

  .sa-table tr:last-child td { border-bottom: none; }

  .sa-table tr:hover td { background: rgba(255,255,255,0.02); }

  .sa-table .num { font-family: 'DM Mono', monospace; font-size: 0.78rem; }
  .sa-table .accent-teal { color: var(--teal); font-weight: 500; }
  .sa-table .accent-green { color: #4ade80; font-weight: 500; }
  .sa-table .accent-red { color: var(--red); font-weight: 700; }
  .sa-table .muted-idx { color: var(--text-muted); font-size: 0.7rem; }

  /* Modal */
  .sa-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 1rem;
  }

  .sa-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    width: 100%; max-width: 680px;
    max-height: 80vh;
    overflow: hidden;
    display: flex; flex-direction: column;
  }

  .sa-modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    background: var(--surface2);
  }

  .sa-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--red);
    display: flex; align-items: center; gap: 0.6rem;
  }

  .sa-modal-body { overflow-y: auto; padding: 0; flex: 1; }

  .sa-modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end;
    background: var(--surface2);
  }

  .sa-btn-close {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-dim);
    padding: 0.5rem 1.25rem;
    border-radius: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .sa-btn-close:hover { border-color: rgba(255,255,255,0.15); color: var(--text); }

  /* Loader */
  .sa-loader {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    flex: 1; gap: 1rem;
  }

  .sa-loader-text {
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  @media (max-width: 640px) {
    .sa-page { padding: 1rem; padding-top: 4.5rem; }
    .sa-title { font-size: 1.5rem; }
    .sa-stat-value { font-size: 1.8rem; }
  }
`;

export default function StockAnalysis() {
  const [data, setData] = useState({
    allRows: [], lowStock: [], godownSummary: [], productSummary: [], grandTotal: {}
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
    return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const currentWS = XLSX.utils.json_to_sheet(data.allRows.map((r, i) => ({
      '#': i + 1, Godown: capitalize(r.godown_name), Type: capitalize(r.product_type),
      Product: r.productname, Brand: capitalize(r.brand), Agent: r.agent_name,
      Cases: r.cases, 'Per Case': r.per_case, 'Total Qty': r.total_qty,
    })));
    XLSX.utils.book_append_sheet(wb, currentWS, 'Current Stock');
    const lowWS = XLSX.utils.json_to_sheet(data.lowStock.map((r, i) => ({
      '#': i + 1, Type: capitalize(r.product_type), Product: r.productname,
      Brand: capitalize(r.brand), Agent: r.agent_name, 'Total Cases': r.total_cases,
    })));
    XLSX.utils.book_append_sheet(wb, lowWS, 'Low Stock');
    const godownWS = XLSX.utils.json_to_sheet(data.godownSummary.map((r, i) => ({
      '#': i + 1, Godown: capitalize(r.godown_name), 'Total Cases': r.total_cases,
    })));
    XLSX.utils.book_append_sheet(wb, godownWS, 'Godown Totals');
    const productWS = XLSX.utils.json_to_sheet(data.productSummary.map((r, i) => ({
      '#': i + 1, Type: capitalize(r.product_type), Product: r.productname,
      Brand: capitalize(r.brand), Agent: r.agent_name,
      'Total Cases': r.total_cases, 'Total Qty': r.total_qty,
    })));
    XLSX.utils.book_append_sheet(wb, productWS, 'Product Totals');
    XLSX.writeFile(wb, `Stock_Analysis_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="sa-root" style={{ display: 'flex', minHeight: '100vh', background: '#0a0c10' }}>
          <Sidebar />
          <Logout />
          <div className="sa-loader" style={{ flex: 1 }}>
            <FaSpinner style={{ color: '#3fedd8', fontSize: '2rem', animation: 'spin 1s linear infinite' }} />
            <p className="sa-loader-text">Loading analysis</p>
          </div>
        </div>
      </>
    );
  }

  if (error) return (
    <>
      <style>{styles}</style>
      <div style={{ padding: '2rem', color: '#f87171', textAlign: 'center', background: '#0a0c10', minHeight: '100vh' }}>{error}</div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="sa-root" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Logout />
        <div className="sa-page">
          <div className="sa-inner">

            {/* Header */}
            <div className="sa-header">
              <div className="sa-title">
                <span>Inventory</span>
                Stock Analysis
              </div>
              <button className="sa-btn-download" onClick={downloadExcel}>
                <FaDownload style={{ fontSize: '0.75rem' }} />
                Export Report
              </button>
            </div>

            {/* Low Stock Alert */}
            {data.lowStock.length > 0 && (
              <div className="sa-alert">
                <div className="sa-alert-left">
                  <FaExclamationTriangle className="sa-alert-icon" />
                  <div>
                    <div className="sa-alert-title">Low Stock Alert</div>
                    <div className="sa-alert-count">{data.lowStock.length} product{data.lowStock.length !== 1 ? 's' : ''} below 3 cases</div>
                  </div>
                </div>
                <button className="sa-btn-view" onClick={() => setLowStockModal(true)}>
                  <FaEye style={{ fontSize: '0.7rem' }} /> View All
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="sa-stats">
              <div className="sa-stat sa-stat--products">
                <div className="sa-stat-label">Unique Products</div>
                <div className="sa-stat-value">{data.grandTotal.unique_products ?? '—'}</div>
              </div>
              <div className="sa-stat sa-stat--cases">
                <div className="sa-stat-label">Total Cases</div>
                <div className="sa-stat-value">{data.grandTotal.total_cases ?? '—'}</div>
              </div>
              <div className="sa-stat sa-stat--qty">
                <div className="sa-stat-label">Total Quantity</div>
                <div className="sa-stat-value">{data.grandTotal.total_quantity ?? '—'}</div>
              </div>
            </div>

            {/* Godown Table */}
            <div className="sa-section">
              <div className="sa-section-title">Cases per Godown</div>
              <div className="sa-card">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Godown</th>
                      <th>Total Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.godownSummary.map((g, i) => (
                      <tr key={i}>
                        <td className="muted-idx num">{String(i + 1).padStart(2, '0')}</td>
                        <td>{capitalize(g.godown_name)}</td>
                        <td className="accent-teal num">{g.total_cases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Table */}
            <div className="sa-section">
              <div className="sa-section-title">Cases per Product</div>
              <div className="sa-card">
                <div style={{ overflowX: 'auto' }}>
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Agent</th>
                        <th>Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.productSummary.map((p, i) => (
                        <tr key={i}>
                          <td className="muted-idx num">{String(i + 1).padStart(2, '0')}</td>
                          <td style={{ color: 'var(--text)' }}>{p.productname}</td>
                          <td>{capitalize(p.brand)}</td>
                          <td style={{ color: '#67e8f9' }}>{p.agent_name}</td>
                          <td className="accent-green num">{p.total_cases}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Low Stock Modal */}
        <Modal
          isOpen={lowStockModal}
          onRequestClose={() => setLowStockModal(false)}
          className="_"
          overlayClassName="_"
          style={{
            overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
            content: { position: 'relative', inset: 'unset', background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', width: '100%', maxWidth: '640px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }
          }}
        >
          <div className="sa-modal-header">
            <div className="sa-modal-title">
              <FaExclamationTriangle />
              Low Stock Products
            </div>
          </div>
          <div className="sa-modal-body">
            <table className="sa-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Agent</th>
                  <th>Cases</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text)' }}>{item.productname}</td>
                    <td>{capitalize(item.brand)}</td>
                    <td style={{ color: '#67e8f9' }}>{item.agent_name}</td>
                    <td className="accent-red num">{item.total_cases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sa-modal-footer">
            <button className="sa-btn-close" onClick={() => setLowStockModal(false)}>Close</button>
          </div>
        </Modal>
      </div>
    </>
  );
}