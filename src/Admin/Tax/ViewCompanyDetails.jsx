import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaEdit, FaTrash, FaPlus, FaBuilding, FaCheckCircle } from 'react-icons/fa';
import { API_BASE_URL } from '../../../Config';

export default function ViewCompanyDetails() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [signFile, setSignFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');
  const [previewSign, setPreviewSign] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/companies`);
      if (!res.ok) throw new Error('Failed to fetch companies');
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch companies error:', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openEdit = (company) => {
    setEditingCompany(company);
    setFormData({ ...company });
    setPreviewLogo(company.logo_url || '');
    setPreviewSign(company.signature_url || '');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        submitData.append(key, value);
      }
    });

    if (logoFile) submitData.append('logo', logoFile);
    if (signFile) submitData.append('signature', signFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/company`, {
        method: 'PUT',
        body: submitData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Update failed');
      }

      setShowEditModal(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        fetchCompanies();
      }, 2000);
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company permanently? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/company/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Delete failed');
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        fetchCompanies();
      }, 2000);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-3xl font-semibold text-gray-700 dark:text-gray-300">
          Loading companies...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6 pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">
              Company Management
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Total Companies: <span className="font-bold text-indigo-600">{companies.length}</span>
            </p>
          </div>

          <div className="text-center mb-12">
            <a
              href="/company-details"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-xl rounded-2xl shadow-xl transition transform hover:scale-105"
            >
              <FaPlus size={24} />
              Add New Company
            </a>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-20">
              <FaBuilding size={80} className="mx-auto text-gray-400 mb-6" />
              <p className="text-3xl text-gray-600 dark:text-gray-400">No companies found</p>
              <p className="text-lg mt-4 text-gray-500">
                Click "Add New Company" to create your first entry
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 text-center">
                    <h3 className="text-2xl font-bold">{comp.company_name || 'Unnamed'}</h3>
                    {comp.tagline && (
                      <p className="text-base mt-2 italic opacity-90">
                        "{comp.tagline}"
                      </p>
                    )}
                    {comp.gstin && (
                      <p className="text-sm mt-1 opacity-90">GSTIN: {comp.gstin}</p>
                    )}
                  </div>

                  {comp.logo_url ? (
                    <div className="flex justify-center py-8 bg-gray-50 dark:bg-gray-900">
                      <img
                        src={comp.logo_url}
                        alt={`${comp.company_name} Logo`}
                        className="w-48 h-48 object-contain rounded-2xl shadow-lg border border-gray-200"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <FaBuilding size={60} className="text-gray-400" />
                    </div>
                  )}

                  <div className="p-6 space-y-4 text-gray-800 dark:text-gray-200">
                    <p><strong>Email:</strong> {comp.email || '—'}</p>
                    <p><strong>Mobile:</strong> {comp.mobile || '—'}</p>
                    <p>
                      <strong>Address:</strong>{' '}
                      <span className="text-sm">{comp.address || '—'}</span>
                    </p>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Bank: {comp.bank_name || '—'} • {comp.branch || '—'}
                      </p>
                    </div>
                  </div>

                  {comp.signature_url && (
                    <div className="px-6 pb-6 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Authorized Signature
                      </p>
                      <img
                        src={comp.signature_url}
                        alt="Signature"
                        className="inline-block w-64 h-28 object-contain bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <div className="flex border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => openEdit(comp)}
                      className="flex-1 flex items-center justify-center gap-2 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold transition"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-5 bg-red-600 hover:bg-red-700 text-white font-bold transition"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 md:p-10">
            <h2 className="text-4xl font-bold text-center mb-10 text-indigo-700 dark:text-indigo-400">
              Edit {editingCompany.company_name}
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <Input
                label="Company Name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
              <Input
                label="Tagline / Slogan"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Sparkle with Safety • Since 1995"
              />
              <Input
                label="GSTIN"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Mobile"
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
              <Input
                label="Address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="bg-indigo-50 dark:bg-gray-900 p-8 rounded-2xl mb-10">
              <h3 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-400">
                Bank Details
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <Input
                  label="Bank Name"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
                <Input
                  label="Branch"
                  value={formData.branch || ''}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                />
                <Input
                  label="Account No."
                  value={formData.account_no || ''}
                  onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                />
                <Input
                  label="IFSC Code"
                  value={formData.ifsc_code || ''}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-10">
              <div>
                <label className="block text-xl font-bold mb-4 text-purple-700">
                  Company Logo
                </label>
                {previewLogo && (
                  <img
                    src={previewLogo}
                    alt="Logo Preview"
                    className="w-64 h-64 object-contain bg-white rounded-xl shadow-lg mb-4 border"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setPreviewLogo(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xl font-bold mb-4 text-purple-700">
                  Digital Signature
                </label>
                {previewSign && (
                  <img
                    src={previewSign}
                    alt="Signature Preview"
                    className="w-80 h-40 object-contain bg-gray-50 rounded-xl shadow-lg mb-4 border"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSignFile(file);
                      setPreviewSign(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10">
              <button
                onClick={handleSave}
                className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-xl rounded-xl shadow-xl transition transform hover:scale-105"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-12 py-5 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl rounded-xl shadow-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 shadow-2xl text-center animate-bounce">
            <FaCheckCircle className="text-9xl text-green-500 mx-auto mb-8" />
            <h2 className="text-5xl font-bold text-green-600 dark:text-green-400">
              Operation Successful!
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
      {...props}
    />
  </div>
);