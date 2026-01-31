// src/pages/ViewCompanyDetails.jsx
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
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error(err);
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
    setFormData(company);
    setPreviewLogo(company.logo_url || '');
    setPreviewSign(company.signature_url || '');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key]);
      }
    });
    if (logoFile) submitData.append('logo', logoFile);
    if (signFile) submitData.append('signature', signFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/company`, {
        method: 'PUT',
        body: submitData,
      });
      if (!res.ok) throw new Error('Update failed');
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
    if (!window.confirm('Delete this company permanently? This cannot be undone!')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/company/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Delete failed');
      }

      // Success feedback
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        fetchCompanies(); // Refresh list
      }, 2000);

    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) return <div className="text-center py-40 text-3xl">Loading companies...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-6 pt-20">
        <div className="hundred:max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">
              All Companies
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Total: <span className="font-bold text-indigo-600">{companies.length}</span> {companies.length === 1 ? 'company' : 'companies'}
            </p>
          </div>

          {/* Add New Button */}
          <div className="text-center mb-10">
            <a
              href="/company-details"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-xl rounded-2xl shadow-xl transition transform hover:scale-105"
            >
              <FaPlus size={28} />
              Add New Company
            </a>
          </div>

          {/* Companies Grid */}
          {companies.length === 0 ? (
            <div className="text-center py-20">
              <FaBuilding size={80} className="mx-auto text-gray-400 mb-6" />
              <p className="text-3xl text-gray-500 dark:text-gray-400">No companies found</p>
              <p className="text-lg mt-4">Click "Add New Company" to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {companies.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 text-center">
                    <h3 className="text-2xl font-bold">{comp.company_name}</h3>
                    {comp.gstin && <p className="text-sm opacity-90 mt-1">GSTIN: {comp.gstin}</p>}
                  </div>

                  {/* Logo */}
                  {comp.logo_url ? (
                    <div className="flex justify-center py-8 bg-gray-50">
                      <img
                        src={comp.logo_url}
                        alt="Logo"
                        className="w-48 h-48 object-contain rounded-2xl shadow-xl border"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FaBuilding size={60} className="text-gray-400" />
                    </div>
                  )}

                  {/* Details */}
                  <div className="p-6 space-y-4 text-black dark:text-white">
                    <p><strong>Email:</strong> {comp.email || '—'}</p>
                    <p><strong>Address:</strong> <span className="text-sm">{comp.address || '—'}</span></p>
                    <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Bank: {comp.bank_name || '—'} • {comp.branch || ''}
                      </p>
                    </div>
                  </div>

                  {/* Signature */}
                  {comp.signature_url && (
                    <div className="px-6 pb-6 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Authorized Signature</p>
                      <img
                        src={comp.signature_url}
                        alt="Signature"
                        className="inline-block w-64 h-28 object-contain bg-gray-50 rounded-xl shadow-lg border"
                      />
                    </div>
                  )}

                  {/* Actions */}
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

      {/* EDIT MODAL */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-10">
            <h2 className="text-4xl font-bold text-center mb-10 text-indigo-700 dark:text-indigo-400">
              Edit {editingCompany.company_name}
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Input label="Company Name" value={formData.company_name || ''} onChange={e => setFormData({...formData, company_name: e.target.value})} required />
              <Input label="GSTIN" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              <Input label="Email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Address" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>

            <div className="bg-indigo-50 dark:bg-gray-900 p-8 rounded-2xl mb-8">
              <h3 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-400">Bank Details</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <Input label="Bank Name" value={formData.bank_name || ''} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
                <Input label="Branch" value={formData.branch || ''} onChange={e => setFormData({...formData, branch: e.target.value})} />
                <Input label="Account No." value={formData.account_no || ''} onChange={e => setFormData({...formData, account_no: e.target.value})} />
                <Input label="IFSC Code" value={formData.ifsc_code || ''} onChange={e => setFormData({...formData, ifsc_code: e.target.value})} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <label className="block text-xl font-bold mb-4">Company Logo</label>
                {previewLogo && <img src={previewLogo} alt="Logo" className="w-64 h-64 object-contain bg-white rounded-xl shadow-lg mb-4 border" />}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); setPreviewLogo(URL.createObjectURL(f)); } }} className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:bg-indigo-600 file:text-white" />
              </div>
              <div>
                <label className="block text-xl font-bold mb-4">Digital Signature</label>
                {previewSign && <img src={previewSign} alt="Sign" className="w-80 h-40 object-contain bg-gray-50 rounded-xl shadow-lg mb-4 border" />}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setSignFile(f); setPreviewSign(URL.createObjectURL(f)); } }} className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:bg-purple-600 file:text-white" />
              </div>
            </div>

            <div className="flex gap-6 mt-12 justify-center">
              <button onClick={handleSave} className="px-16 py-5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-xl rounded-xl shadow-xl transition transform hover:scale-105">
                Save Changes
              </button>
              <button onClick={() => setShowEditModal(false)} className="px-16 py-5 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xl rounded-xl shadow-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-20 shadow-3xl text-center animate-bounce">
            <FaCheckCircle className="text-9xl text-green-500 mx-auto mb-8" />
            <h2 className="text-5xl font-bold text-green-600 dark:text-green-400">Updated Successfully!</h2>
          </div>
        </div>
      )}
    </div>
  );
}

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">{label}</label>
    <input className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 outline-none text-black dark:text-white" {...props} />
  </div>
);