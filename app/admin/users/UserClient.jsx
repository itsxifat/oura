'use client';

import { toggleUserBan, toggleUserRole, deleteUser } from '@/app/actions';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldAlert, Ban, Trash2, CheckCircle2,
  User as UserIcon, Mail, Phone, Loader2,
  ChevronLeft, ChevronRight, MoreVertical, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdminPageHeader, AdminStatCard, AdminFilterBar, AdminFilterRow,
  AdminSearchInput, CustomSelect, AdminEmptyState, AdminCard,
} from '@/app/admin/components/AdminUI';

const ROLE_OPTIONS = [
  { value: 'all',   label: 'All Roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'user',  label: 'Users' },
];

const ITEMS_PER_PAGE = 15;

// ── avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  const ring = user.role === 'admin' ? 'border-2 border-[#800000]' : 'border border-gray-200';
  return (
    <div className={`${sz} ${ring} rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0
      ${user.role === 'admin' ? 'bg-[#800000]/10 text-[#800000]' : 'bg-gray-100 text-gray-500'}`}
    >
      {user.image
        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
        : (user.name?.charAt(0) || 'U').toUpperCase()
      }
    </div>
  );
}

// ── user row ───────────────────────────────────────────────────────────────────
function UserRow({ user, loading, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoading = loading === user._id;

  return (
    <div className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors relative">

      {/* ── Mobile layout ── */}
      <div className="sm:hidden flex items-center gap-3 p-4">
        <Avatar user={user} size="lg"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-sm text-gray-900 truncate">{user.name || 'Unknown'}</p>
            {user.role === 'admin' && <Shield size={11} className="text-[#800000] fill-[#800000] shrink-0"/>}
            {user.isBanned && <Ban size={11} className="text-red-500 shrink-0"/>}
          </div>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
          {user.phone && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{user.phone}</p>}
          <div className="flex gap-1.5 mt-1.5">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border
              ${user.role === 'admin' ? 'bg-[#800000] text-white border-[#800000]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {user.role}
            </span>
            {user.isBanned
              ? <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200">Banned</span>
              : <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">Active</span>
            }
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={18}/>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}/>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                >
                  <MobileMenuBtn icon={user.role === 'admin' ? ShieldAlert : Shield} label={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'} onClick={() => { onAction('role', user._id, user.role); setMenuOpen(false); }}/>
                  <MobileMenuBtn icon={Ban} label={user.isBanned ? 'Unban User' : 'Ban User'} onClick={() => { onAction('ban', user._id, user.isBanned); setMenuOpen(false); }} color="text-amber-600"/>
                  <MobileMenuBtn icon={Trash2} label="Delete User" onClick={() => { onAction('delete', user._id); setMenuOpen(false); }} color="text-red-600"/>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3.5 items-center group">

        {/* Identity */}
        <div className="col-span-4 flex items-center gap-3 min-w-0">
          <Avatar user={user}/>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate group-hover:text-[#800000] transition-colors flex items-center gap-1.5">
              {user.name || 'Unknown'}
              {user.role === 'admin' && <Shield size={11} className="text-[#800000] fill-[#800000] shrink-0"/>}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="col-span-3 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail size={11} className="text-gray-400 shrink-0"/>
            <span className="text-[11px] text-gray-600 truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-gray-400 shrink-0"/>
              <span className="text-[11px] font-mono text-gray-500">{user.phone}</span>
            </div>
          )}
        </div>

        {/* Role + Status */}
        <div className="col-span-3 flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border
            ${user.role === 'admin' ? 'bg-[#800000] text-white border-[#800000]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {user.role}
          </span>
          {user.isBanned
            ? <span className="text-[9px] font-black uppercase px-2 py-1 rounded border bg-red-50 text-red-600 border-red-200 flex items-center gap-1"><Ban size={9}/>Banned</span>
            : <span className="text-[9px] font-black uppercase px-2 py-1 rounded border bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle2 size={9}/>Active</span>
          }
        </div>

        {/* Actions */}
        <div className="col-span-2 flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAction('role', user._id, user.role)}
            disabled={isLoading}
            title={user.role === 'admin' ? 'Demote' : 'Promote'}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-[#800000] hover:border-[#800000]/30 hover:bg-[#800000]/5 transition-all disabled:opacity-40"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin"/> : <ShieldAlert size={13}/>}
          </button>
          <button
            onClick={() => onAction('ban', user._id, user.isBanned)}
            disabled={isLoading}
            title={user.isBanned ? 'Unban' : 'Ban'}
            className={`p-2 rounded-lg border transition-all disabled:opacity-40
              ${user.isBanned ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'}`}
          >
            <Ban size={13}/>
          </button>
          <button
            onClick={() => onAction('delete', user._id)}
            disabled={isLoading}
            title="Delete"
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40"
          >
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileMenuBtn({ icon: Icon, label, onClick, color = 'text-gray-700' }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide hover:bg-gray-50 transition-colors ${color}`}
    >
      <Icon size={14}/> {label}
    </button>
  );
}

// ── main component ─────────────────────────────────────────────────────────────
export default function UserClient({ initialUsers }) {
  const router      = useRouter();
  const [loading, setLoading]   = useState(null);
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('all');
  const [page, setPage]         = useState(1);

  const handleAction = async (action, id, param) => {
    setLoading(id);
    try {
      if (action === 'ban')    await toggleUserBan(id, param);
      if (action === 'role')   await toggleUserRole(id, param);
      if (action === 'delete') {
        if (!confirm('Permanently delete this user?')) { setLoading(null); return; }
        await deleteUser(id);
      }
      router.refresh();
    } catch { alert('Action failed'); }
    setLoading(null);
  };

  const filtered = useMemo(() => {
    let list = initialUsers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q));
    }
    if (role !== 'all') list = list.filter(u => u.role === role);
    return list;
  }, [initialUsers, search, role]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated    = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const adminCount   = initialUsers.filter(u => u.role === 'admin').length;
  const bannedCount  = initialUsers.filter(u => u.isBanned).length;

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">

      <AdminPageHeader eyebrow="Community" title="Users" count={filtered.length} countLabel="users"/>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <AdminStatCard label="Total Users"   value={initialUsers.length} icon={UserIcon}  color="bg-gray-100 text-gray-600"/>
          <AdminStatCard label="Admins"        value={adminCount}          icon={Shield}    color="bg-[#800000]/10 text-[#800000]"/>
          <AdminStatCard label="Restricted"    value={bannedCount}         icon={Ban}       color="bg-red-50 text-red-600" highlight={bannedCount > 0}/>
        </div>

        {/* Filters */}
        <AdminFilterBar>
          <AdminFilterRow>
            <AdminSearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Name, Email, Phone…" className="sm:col-span-3"/>
            <CustomSelect value={role} onChange={v => { setRole(v); setPage(1); }} options={ROLE_OPTIONS}/>
          </AdminFilterRow>
        </AdminFilterBar>

        {/* Table */}
        <AdminCard noPad>

          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50">
            {['Identity', 'Contact', 'Role & Status', ''].map((h, i) => (
              <div key={i} className={`text-[9px] font-black uppercase tracking-widest text-gray-400
                ${i === 0 ? 'col-span-4' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-3' : 'col-span-2 text-right'}`}>
                {h}
              </div>
            ))}
          </div>

          {paginated.length === 0 ? (
            <AdminEmptyState icon={UserIcon} title="No users found" subtitle="Try adjusting your search"/>
          ) : (
            <div>
              {paginated.map(u => (
                <UserRow key={u._id} user={u} loading={loading} onAction={handleAction}/>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15}/>
              </button>
              <span className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 min-w-[80px] text-center">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15}/>
              </button>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
