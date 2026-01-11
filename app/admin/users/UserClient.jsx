'use client';

import { toggleUserBan, toggleUserRole, deleteUser } from '@/app/actions';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Shield, ShieldAlert, Ban, Trash2, CheckCircle2, 
  User as UserIcon, Mail, Phone, Loader2, ChevronLeft, ChevronRight, MoreVertical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- STAT CARD COMPONENT ---
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between min-w-[140px] flex-1 md:flex-none">
    <div>
      <p className="text-[9px] md:text-[10px] uppercase text-gray-400 font-bold tracking-widest">{label}</p>
      <p className="text-xl md:text-2xl font-bodoni text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-2 md:p-3 rounded-xl ${color}`}>
      <Icon size={18} className="md:w-5 md:h-5" />
    </div>
  </div>
);

export default function UserClient({ initialUsers }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null); 
  
  const ITEMS_PER_PAGE = 10;

  // --- ACTIONS ---
  const handleAction = async (action, id, param) => {
    setIsLoading(id);
    setMobileMenuOpen(null);
    try {
      if (action === 'ban') await toggleUserBan(id, param);
      if (action === 'role') await toggleUserRole(id, param);
      if (action === 'delete') {
        if(confirm('Are you sure? This user will be permanently deleted.')) await deleteUser(id);
      }
      router.refresh();
    } catch (e) {
      alert("Action failed");
    } finally {
      setIsLoading(null);
    }
  };

  // --- FILTERING ---
  const filteredUsers = useMemo(() => {
    let users = initialUsers;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      users = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(lower)) || 
        (u.email && u.email.toLowerCase().includes(lower))
      );
    }
    if (filterRole !== 'all') {
      users = users.filter(u => u.role === filterRole);
    }
    return users;
  }, [initialUsers, searchTerm, filterRole]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const totalCount = initialUsers.length;
  const adminCount = initialUsers.filter(u => u.role === 'admin').length;
  const bannedCount = initialUsers.filter(u => u.isBanned).length;

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope p-4 md:p-8 pt-24 lg:pt-8 text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row justify-between xl:items-end mb-8 border-b border-gray-200 pb-8 gap-6">
          <div>
            <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs">Community</span>
            <h1 className="font-bodoni text-3xl md:text-5xl mt-2 text-black">User Management</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Control access, roles, and user security.</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
             <StatCard label="Users" value={totalCount} icon={UserIcon} color="bg-gray-100 text-gray-600" />
             <StatCard label="Admins" value={adminCount} icon={Shield} color="bg-[#D4AF37]/10 text-[#D4AF37]" />
             <StatCard label="Restricted" value={bannedCount} icon={Ban} color="bg-red-50 text-red-500" />
          </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search name or email..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-[#D4AF37] rounded-xl text-sm outline-none transition-all"
              />
           </div>

           <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
              {['all', 'admin', 'user'].map((role) => (
                 <button
                   key={role}
                   onClick={() => { setFilterRole(role); setCurrentPage(1); }}
                   className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filterRole === role ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   {role}
                 </button>
              ))}
           </div>
        </div>

        {/* --- USER LIST --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
           
           {/* DESKTOP HEADER */}
           <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 bg-[#faf9f6]/50 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              <div className="col-span-4 pl-2">User Identity</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right pr-4">Actions</div>
           </div>

           <div className="flex-1">
             {paginatedUsers.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                  <UserIcon size={48} className="mb-4 opacity-20"/>
                  <span className="uppercase tracking-widest text-xs font-bold">No users found</span>
               </div>
             ) : (
               paginatedUsers.map((user) => (
                 <div key={user._id} className="group border-b border-gray-50 last:border-0 hover:bg-[#faf9f6] transition-colors relative">
                    
                    {/* --- DESKTOP ROW --- */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                        <div className="col-span-4 flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold border-2 ${user.role === 'admin' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 text-gray-400 bg-gray-50'} overflow-hidden`}>
                              {user.image ? (
                                 <img 
                                   src={user.image} 
                                   alt={user.name} 
                                   className="w-full h-full object-cover" 
                                   referrerPolicy="no-referrer" // FIX FOR GOOGLE IMAGES
                                 />
                              ) : (
                                 (user.name?.charAt(0) || 'U').toUpperCase()
                              )}
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bodoni font-bold text-gray-900 flex items-center gap-2 truncate">
                                 {user.name || 'Unknown'}
                                 {user.role === 'admin' && <Shield size={12} className="text-[#D4AF37] fill-[#D4AF37] flex-shrink-0"/>}
                              </h4>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>

                        <div className="col-span-3 space-y-1 min-w-0">
                           <div className="flex items-center gap-2 text-xs text-gray-600 font-medium truncate">
                              <Mail size={12} className="text-gray-300 flex-shrink-0"/> <span className="truncate">{user.email}</span>
                           </div>
                           {user.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                                 <Phone size={12} className="text-gray-300 flex-shrink-0"/> {user.phone}
                              </div>
                           )}
                        </div>

                        <div className="col-span-2 flex justify-center gap-2">
                           {user.isBanned ? (
                              <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-bold uppercase rounded flex items-center gap-1 border border-red-100"><Ban size={10}/> Banned</span>
                           ) : (
                              <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-bold uppercase rounded flex items-center gap-1 border border-green-100"><CheckCircle2 size={10}/> Active</span>
                           )}
                        </div>

                        <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ActionButton user={user} isLoading={isLoading} handleAction={handleAction} />
                        </div>
                    </div>

                    {/* --- MOBILE CARD --- */}
                    <div className="md:hidden p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold border-2 ${user.role === 'admin' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-100 text-gray-400 bg-gray-50'} overflow-hidden`}>
                              {user.image ? (
                                <img 
                                  src={user.image} 
                                  alt={user.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer" // FIX FOR GOOGLE IMAGES
                                />
                              ) : (
                                (user.name?.charAt(0) || 'U').toUpperCase()
                              )}
                          </div>
                          <div className="min-w-0">
                             <div className="flex items-center gap-2">
                                <h4 className="font-bodoni font-bold text-gray-900 truncate">{user.name || 'Unknown'}</h4>
                                {user.role === 'admin' && <Shield size={12} className="text-[#D4AF37] fill-[#D4AF37]"/>}
                                {user.isBanned && <Ban size={12} className="text-red-500"/>}
                             </div>
                             <p className="text-xs text-gray-500 truncate">{user.email}</p>
                             <div className="flex gap-2 mt-1">
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${user.role === 'admin' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{user.role}</span>
                             </div>
                          </div>
                       </div>
                       
                       {/* Mobile Menu Trigger */}
                       <div className="relative">
                          <button onClick={() => setMobileMenuOpen(mobileMenuOpen === user._id ? null : user._id)} className="p-2 text-gray-400 hover:text-black">
                             <MoreVertical size={20}/>
                          </button>
                          
                          <AnimatePresence>
                             {mobileMenuOpen === user._id && (
                                <motion.div 
                                  initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}}
                                  className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden"
                                >
                                   <div className="flex flex-col p-1">
                                      <MobileActionBtn icon={user.role==='admin'?ShieldAlert:Shield} label={user.role==='admin'?"Demote":"Promote"} onClick={() => handleAction('role', user._id, user.role)} />
                                      <MobileActionBtn icon={Ban} label={user.isBanned?"Unban":"Ban User"} onClick={() => handleAction('ban', user._id, user.isBanned)} color="text-orange-500 hover:bg-orange-50" />
                                      <MobileActionBtn icon={Trash2} label="Delete" onClick={() => handleAction('delete', user._id)} color="text-red-500 hover:bg-red-50" />
                                   </div>
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                    </div>

                 </div>
               ))
             )}
           </div>

           {/* Pagination Footer */}
           <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 Showing {paginatedUsers.length} of {filteredUsers.length} Users
              </span>
              <div className="flex gap-2">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16}/></button>
                 <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold flex items-center">Page {currentPage}</span>
                 <button disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16}/></button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

const ActionButton = ({ user, isLoading, handleAction }) => (
  <>
    <button onClick={() => handleAction('role', user._id, user.role)} disabled={isLoading === user._id} className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-black hover:border-black flex items-center justify-center transition-all bg-white" title="Change Role">
      {isLoading === user._id ? <Loader2 size={14} className="animate-spin"/> : <ShieldAlert size={14}/>}
    </button>
    <button onClick={() => handleAction('ban', user._id, user.isBanned)} disabled={isLoading === user._id} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-white ${user.isBanned ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'}`} title={user.isBanned ? "Unban" : "Ban"}>
      <Ban size={14}/>
    </button>
    <button onClick={() => handleAction('delete', user._id)} disabled={isLoading === user._id} className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all bg-white" title="Delete">
      <Trash2 size={14}/>
    </button>
  </>
);

const MobileActionBtn = ({ icon: Icon, label, onClick, color = "text-gray-600 hover:bg-gray-50" }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-left transition-colors rounded-lg ${color}`}>
    <Icon size={16}/> {label}
  </button>
);