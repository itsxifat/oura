'use client';

import { useState, useEffect } from 'react';
import { addAccount, deleteAccount, refreshAllAccounts, getAccounts } from '@/actions/steadfastAuth';
import { Save, Trash2, RefreshCw, CheckCircle, XCircle, Plus, Shield } from 'lucide-react';

export default function AccountSettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCreds, setNewCreds] = useState({ email: '', password: '' });

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    const data = await getAccounts();
    setAccounts(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCreds.email || !newCreds.password) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('email', newCreds.email);
    formData.append('password', newCreds.password);
    
    await addAccount(formData);
    setNewCreds({ email: '', password: '' });
    await loadAccounts();
    setLoading(false);
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    await refreshAllAccounts();
    await loadAccounts();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!confirm("Remove this account?")) return;
    await deleteAccount(id);
    await loadAccounts();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-manrope">
      <div className="flex justify-between items-center mb-8">
         <h1 className="font-bodoni text-3xl font-bold">Steadfast Accounts</h1>
         <button onClick={handleRefreshAll} disabled={loading} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-[#D4AF37] transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh All Sessions
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         
         {/* ADD FORM */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus size={18}/> Add New Account</h3>
            <form onSubmit={handleAdd} className="space-y-4">
               <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Email</label>
                  <input 
                    type="email" 
                    value={newCreds.email}
                    onChange={e => setNewCreds({...newCreds, email: e.target.value})}
                    className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-black"
                    placeholder="merchant@example.com"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Password</label>
                  <input 
                    type="password" 
                    value={newCreds.password}
                    onChange={e => setNewCreds({...newCreds, password: e.target.value})}
                    className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-black"
                    placeholder="********"
                  />
               </div>
               <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors">
                  {loading ? 'Processing...' : 'Save & Login'}
               </button>
            </form>
         </div>

         {/* ACCOUNT LIST */}
         <div className="space-y-4">
            {accounts.length === 0 && <p className="text-gray-400 text-sm">No accounts added yet.</p>}
            
            {accounts.map(acc => (
               <div key={acc._id} className={`p-4 rounded-xl border flex justify-between items-center bg-white shadow-sm ${acc.isValid ? 'border-green-100' : 'border-red-100'}`}>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-800">{acc.email}</span>
                        {acc.isValid ? (
                           <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle size={10}/> Active</span>
                        ) : (
                           <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><XCircle size={10}/> Failed</span>
                        )}
                     </div>
                     <div className="text-xs text-gray-400 mt-1">
                        Last Used: {acc.lastUsed ? new Date(acc.lastUsed).toLocaleString() : 'Never'}
                     </div>
                     {!acc.isValid && acc.errorMsg && (
                        <div className="text-[10px] text-red-500 mt-1 max-w-xs truncate">{acc.errorMsg}</div>
                     )}
                  </div>
                  <button onClick={() => handleDelete(acc._id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                     <Trash2 size={16} />
                  </button>
               </div>
            ))}
         </div>

      </div>
    </div>
  );
}