'use client';

import { useState, useEffect, useRef } from 'react';
import { addAccount, deleteAccount, refreshAllAccounts, getAccounts } from '@/actions/steadfastAuth';
import { Save, Trash2, RefreshCw, CheckCircle, XCircle, Plus, Shield, Loader2, Eye, EyeOff, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: 20 }}
    className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 border ${
      type === 'success' 
        ? 'bg-[#800000] text-white border-[#D4AF37]' 
        : 'bg-red-50 text-red-600 border-red-200'
    }`}
  >
    {type === 'success' ? <CheckCircle size={16} className="text-[#D4AF37]" /> : <XCircle size={16} />}
    <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
  </motion.div>
);

export default function AccountSettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newCreds, setNewCreds] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadAccounts(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAccounts = async () => {
    const data = await getAccounts();
    setAccounts(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCreds.email || !newCreds.password) return;
    
    setActionLoading(true);
    const formData = new FormData();
    formData.append('email', newCreds.email);
    formData.append('password', newCreds.password);
    
    try {
        await addAccount(formData);
        setNewCreds({ email: '', password: '' });
        await loadAccounts();
        showToast("Account Connected Successfully");
    } catch (error) {
        showToast("Failed to connect account", "error");
    }
    setActionLoading(false);
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    try {
        await refreshAllAccounts();
        await loadAccounts();
        showToast("All Sessions Refreshed");
    } catch (error) {
        showToast("Refresh Failed", "error");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!confirm("Remove this account? Shipping labels linked to this account may be affected.")) return;
    await deleteAccount(id);
    await loadAccounts();
    showToast("Account Removed");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-8 pt-24 lg:pt-8 font-manrope text-gray-900">
      <div className="max-w-5xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-6 gap-4">
            <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#800000] block mb-2">Courier Integration</span>
                <h1 className="font-bodoni text-4xl text-black">Steadfast Accounts</h1>
                <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Manage API connections for automated shipping labels.</p>
            </div>
            <button 
                onClick={handleRefreshAll} 
                disabled={loading} 
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-[#800000] hover:text-[#800000] transition-all disabled:opacity-50 shadow-sm"
            >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 
                {loading ? 'Refreshing...' : 'Refresh Sessions'}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
             
             {/* --- ADD FORM (4 Cols) --- */}
             <div className="md:col-span-5 lg:col-span-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group h-fit sticky top-8">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#800000]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-all group-hover:bg-[#800000]/10"></div>

                    <h3 className="font-bold text-xs uppercase tracking-widest mb-6 text-gray-900 flex items-center gap-2">
                        <Shield size={14} className="text-[#800000]"/> New Connection
                    </h3>

                    <form onSubmit={handleAdd} className="space-y-5">
                        <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Merchant Email</label>
                           <input 
                             type="email" 
                             value={newCreds.email}
                             onChange={e => setNewCreds({...newCreds, email: e.target.value})}
                             className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:border-[#800000] transition-all placeholder:text-gray-300"
                             placeholder="merchant@steadfast.com"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Password</label>
                           <div className="relative">
                               <input 
                                 type={showPassword ? "text" : "password"}
                                 value={newCreds.password}
                                 onChange={e => setNewCreds({...newCreds, password: e.target.value})}
                                 className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:border-[#800000] transition-all placeholder:text-gray-300 pr-10"
                                 placeholder="••••••••"
                               />
                               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#800000]">
                                   {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                               </button>
                           </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={actionLoading} 
                            className="w-full bg-[#800000] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#800000]/20"
                        >
                           {actionLoading ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14}/>}
                           {actionLoading ? 'Connecting...' : 'Connect Account'}
                        </button>
                    </form>
                </div>
             </div>

             {/* --- ACCOUNT LIST (8 Cols) --- */}
             <div className="md:col-span-7 lg:col-span-8 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 px-2">Active Integrations</h3>
                
                {accounts.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <Truck size={32} className="mx-auto mb-3 text-gray-300"/>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No accounts connected</p>
                    </div>
                )}
                
                <AnimatePresence>
                    {accounts.map(acc => (
                       <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           key={acc._id} 
                           className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shadow-sm transition-all hover:shadow-md group ${acc.isValid ? 'border-l-4 border-l-green-500 border-gray-100' : 'border-l-4 border-l-red-500 border-gray-100'}`}
                       >
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-base text-gray-900">{acc.email}</span>
                                {acc.isValid ? (
                                   <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-bold uppercase tracking-wide flex items-center gap-1">
                                      <CheckCircle size={10}/> Verified
                                   </span>
                                ) : (
                                   <span className="text-[9px] bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-bold uppercase tracking-wide flex items-center gap-1">
                                      <XCircle size={10}/> Auth Failed
                                   </span>
                                )}
                             </div>
                             
                             <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono mt-1">
                                <span>ID: <span className="text-gray-600">{acc._id.slice(-6)}</span></span>
                                <span>•</span>
                                <span>Last Sync: {acc.lastUsed ? new Date(acc.lastUsed).toLocaleDateString() : 'Never'}</span>
                             </div>

                             {!acc.isValid && acc.errorMsg && (
                                <div className="text-[10px] text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2">
                                    <AlertCircle size={12} className="shrink-0 mt-0.5"/>
                                    {acc.errorMsg}
                                </div>
                             )}
                          </div>
                          
                          <button 
                            onClick={() => handleDelete(acc._id)} 
                            className="mt-4 sm:mt-0 ml-auto sm:ml-4 text-gray-300 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Remove Account"
                          >
                             <Trash2 size={16} />
                          </button>
                       </motion.div>
                    ))}
                </AnimatePresence>
             </div>

        </div>

        {/* TOAST RENDERER */}
        <AnimatePresence>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}