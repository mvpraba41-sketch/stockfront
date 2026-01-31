import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../../Admin/Logout';

export default function PendingPayments() {
  const [pending, setPending] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState({ 
    amount_paid: '', 
    payment_method: 'cash', 
    transaction_date: new Date(), 
    admin_id: '', 
    bank_name: '' 
  });
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyModal, setHistoryModal] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/pending`);
      setPending(data);
      setFiltered(data);
    } catch (err) {
      setError('Failed to load pending payments');
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admins`);
      setAdmins(data);
    } catch (err) {
      setError('Failed to load admins');
    }
  };

  useEffect(() => { 
    fetchPending(); 
    fetchAdmins(); 
  }, [fetchPending]);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFiltered(pending.filter(b => 
      b.customer_name?.toLowerCase().includes(lower) || 
      b.bill_number?.toLowerCase().includes(lower)
    ));
    setPage(1);
  }, [search, pending]);

  const openPayment = (b) => {
    setBooking(b);
    setForm({ 
      ...form, 
      amount_paid: (parseFloat(b.balance) || 0).toFixed(2), 
      admin_id: '', 
      bank_name: '' 
    });
    setModal(true);
  };

  const submitPayment = async () => {
    if (!form.admin_id || !form.amount_paid) {
      return setError("Select admin & amount");
    }
    try {
      await axios.post(`${API_BASE_URL}/api/payment`, {
        booking_id: booking.id,
        amount_paid: parseFloat(form.amount_paid),
        payment_method: form.payment_method,
        transaction_date: form.transaction_date.toISOString().split('T')[0],
        bank_name: form.payment_method === 'bank' ? form.bank_name : null,
        admin_id: form.admin_id
      });
      setError('');
      setModal(false);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.error || "Payment failed");
    }
  };

  const viewHistory = async (id) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/payments/${id}`);
      setHistory(data);
      setHistoryModal(true);
    } catch (err) {
      setError('Failed to load history');
    }
  };

  const current = filtered.slice((page - 1) * perPage, page * perPage);
  const pages = Math.ceil(filtered.length / perPage);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-3xl font-bold text-center mb-6 text-black dark:text-white">
          Pending Payments
        </h1>

        <input
          type="text"
          placeholder="Search by customer or bill number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-3 border rounded mb-6 text-black dark:text-white bg-white dark:bg-gray-800"
        />

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {current.map(b => (
            <div key={b.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <p className="text-black dark:text-white">
                <strong>Bill:</strong> {b.bill_number}
              </p>
              <p className="text-black dark:text-white">
                <strong>Customer:</strong> {b.customer_name}
              </p>
              <p className="text-black dark:text-white">
                <strong>Balance:</strong> ₹{parseFloat(b.balance).toFixed(2)}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openPayment(b)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"
                >
                  Pay
                </button>
                <button
                  onClick={() => viewHistory(b.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 transition"
                >
                  History
                </button>
              </div>
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded text-black dark:text-white ${
                  page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                } transition`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {modal && booking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
                Pay Bill {booking.bill_number}
              </h2>

              <select
                value={form.admin_id}
                onChange={e => setForm({ ...form, admin_id: e.target.value })}
                className="w-full p-2 border rounded mb-3 text-black dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="">Select Admin</option>
                {admins.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.username} {a.bank_name?.length > 0 && `(${a.bank_name.join(', ')})`}
                  </option>
                ))}
              </select>

              <select
                value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value, bank_name: '' })}
                className="w-full p-2 border rounded mb-3 text-black dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Amount to Pay"
                value={form.amount_paid}
                onChange={e => setForm({ ...form, amount_paid: e.target.value })}
                className="w-full p-2 border rounded mb-3 text-black dark:text-white bg-white dark:bg-gray-700"
              />

              {form.payment_method === 'bank' && (
                <input
                  type="text"
                  placeholder="Bank Name / Ref"
                  value={form.bank_name}
                  onChange={e => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full p-2 border rounded mb-3 text-black dark:text-white bg-white dark:bg-gray-700"
                />
              )}

              <div className="mb-3">
                <DatePicker
                  selected={form.transaction_date}
                  onChange={d => setForm({ ...form, transaction_date: d })}
                  dateFormat="dd/MM/yyyy"
                  className="w-full p-2 border rounded text-black dark:text-white bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPayment}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        )}

        {historyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded w-full max-w-md shadow-xl max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
                Payment History
              </h2>
              {history.length === 0 ? (
                <p className="text-center text-gray-500">No payments yet</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="p-2 text-left text-black dark:text-white">Date</th>
                      <th className="p-2 text-right text-black dark:text-white">Amount</th>
                      <th className="p-2 text-center text-black dark:text-white">Method</th>
                      <th className="p-2 text-center text-black dark:text-white">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} className="border-b dark:border-gray-700">
                        <td className="p-2 text-black dark:text-white">
                          {new Date(h.transaction_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-2 text-right text-black dark:text-white">
                          ₹{parseFloat(h.amount_paid).toFixed(2)}
                        </td>
                        <td className="p-2 text-center text-black dark:text-white">
                          {h.payment_method === 'bank' ? 'Bank' : 'Cash'}
                          {h.bank_name && ` (${h.bank_name})`}
                        </td>
                        <td className="p-2 text-center text-black dark:text-white">
                          {h.admin_name || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button
                onClick={() => setHistoryModal(false)}
                className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}