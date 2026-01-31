import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../Config";
import Sidebar from "../Sidebar/Sidebar";
import Logout from "../../Admin/Logout";

export default function Admin() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [newBankName, setNewBankName] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  const [targetAdminForBank, setTargetAdminForBank] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const loggedIn = localStorage.getItem("username");

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admins`);
      setAdmins(data);
    } catch (err) {
      setError("Failed to load admins");
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    if (!username) return;
    try {
      await axios.post(`${API_BASE_URL}/api/admins`, { username });
      setSuccess("Admin created!");
      setUsername("");
      fetchAdmins();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Error creating admin");
      setTimeout(() => setError(""), 3000);
    }
  };

  const selectAdmin = async (admin) => {
    setSelectedAdmin(admin);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admins/${admin.id}/transactions`);
      setTransactions(data);

      const banks = await axios.get(`${API_BASE_URL}/api/admins/${admin.username}/bank-accounts`);
      setBankAccounts(banks.data);
    } catch (err) {
      setError("Failed to load data");
    }
    setFilterType("");
    setShowModal(true);
  };

  const openAddBank = (admin) => {
    setTargetAdminForBank(admin);
    setNewBankName("");
    setShowAddBank(true);
  };

  const addBank = async (e) => {
    e.preventDefault();
    if (!newBankName.trim()) return setError("Bank name required");

    try {
      await axios.post(`${API_BASE_URL}/api/admins/bank-accounts`, {
        username: targetAdminForBank.username,
        bank_name: newBankName.trim()
      });

      setSuccess(`Bank added to ${targetAdminForBank.username}`);
      setNewBankName("");
      setShowAddBank(false);

      if (selectedAdmin?.username === targetAdminForBank.username) {
        const { data } = await axios.get(`${API_BASE_URL}/api/admins/${targetAdminForBank.username}/bank-accounts`);
        setBankAccounts(data);
      }

      fetchAdmins();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add bank");
      setTimeout(() => setError(""), 3000);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filtered = filterType === "cash"
    ? transactions.filter(t => t.payment_method === "cash")
    : filterType
      ? transactions.filter(t => t.bank_name === filterType)
      : transactions;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 md:ml-64">
        <h1 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">Admin Panel</h1>

        {success && (
          <div className="max-w-md mx-auto bg-green-100 p-3 rounded mb-4 text-center text-black">
            {success}
          </div>
        )}
        {error && (
          <div className="max-w-md mx-auto bg-red-100 p-3 rounded mb-4 text-center text-black">
            {error}
          </div>
        )}

        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Create Admin</h2>
          <form onSubmit={createAdmin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded text-black dark:text-white bg-white dark:bg-gray-700"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              Create Admin
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {admins.map((a) => (
            <div key={a.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-lg hover:shadow-xl transition">
              <h3 className="font-bold text-lg text-black dark:text-white">{a.username}</h3>
              {a.username === loggedIn && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">You</span>
              )}
              <p className="text-sm text-black dark:text-white mt-2">
                <strong>Banks:</strong> {a.bank_name.length > 0 ? a.bank_name.join(", ") : "None"}
              </p>
              <p className="text-sm text-black dark:text-white">
                <strong>Total Collected:</strong> ₹{parseFloat(a.total || 0).toFixed(2)}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openAddBank(a)}
                  className="flex-1 bg-green-600 text-white py-1.5 text-sm rounded hover:bg-green-700 transition"
                >
                  Add Bank
                </button>
                <button
                  onClick={() => selectAdmin(a)}
                  className="flex-1 bg-indigo-600 text-white py-1.5 text-sm rounded hover:bg-indigo-700 transition"
                >
                  View Transactions
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddBank && targetAdminForBank && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold mb-4 text-black dark:text-white">
                Add Bank for <span className="text-blue-600">{targetAdminForBank.username}</span>
              </h3>
              <form onSubmit={addBank} className="space-y-4">
                <input
                  type="text"
                  placeholder="Bank Name (e.g. SBI, HDFC)"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full p-3 border rounded text-black dark:text-white bg-white dark:bg-gray-700"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                  >
                    Save Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBank(false);
                      setTargetAdminForBank(null);
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-5xl max-h-[85vh] overflow-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-3 border-b">
                <h3 className="text-xl font-bold text-black dark:text-white">
                  Transactions: <span className="text-indigo-600">{selectedAdmin.username}</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-3xl text-black dark:text-white hover:text-red-600 transition"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded text-black dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="">All Payments</option>
                  <option value="cash">Cash Only</option>
                  {bankAccounts.map((b) => (
                    <option key={b} value={b}>
                      Bank: {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 dark:bg-gray-700 sticky">
                    <tr>
                      <th className="p-3 text-left text-black dark:text-white">Bill #</th>
                      <th className="p-3 text-left text-black dark:text-white">Customer</th>
                      <th className="p-3 text-right text-black dark:text-white">Amount</th>
                      <th className="p-3 text-left text-black dark:text-white">Method</th>
                      <th className="p-3 text-left text-black dark:text-white">Bank</th>
                      <th className="p-3 text-left text-black dark:text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-black dark:text-white">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t) => (
                        <tr key={t.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-3 text-black dark:text-white">{t.bill_number}</td>
                          <td className="p-3 text-black dark:text-white">{t.customer_name}</td>
                          <td className="p-3 text-right font-medium text-black dark:text-white">
                            ₹{parseFloat(t.amount_paid).toFixed(2)}
                          </td>
                          <td className="p-3 text-black dark:text-white">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                t.payment_method === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {t.payment_method.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-black dark:text-white">{t.bank_name || "-"}</td>
                          <td className="p-3 text-black dark:text-white">
                            {new Date(t.transaction_date).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}