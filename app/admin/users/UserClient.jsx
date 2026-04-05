'use client';

import { toggleUserBan, toggleUserRole, deleteUser, getUserDetail } from '@/app/actions';
import { blockEntity, unblockEntity } from '@/actions/security';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldAlert, Ban, Trash2, CheckCircle2,
  User as UserIcon, Mail, Phone, Loader2,
  ChevronLeft, ChevronRight, MoreVertical, X,
  Globe, Monitor, ChevronDown, ChevronUp,
  ShoppingBag, Clock, WifiOff, Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AdminPageHeader, AdminStatCard, AdminFilterBar, AdminFilterRow,
  AdminSearchInput, CustomSelect, AdminEmptyState, AdminCard,
} from '@/app/admin/components/AdminUI';

const ROLE_OPTIONS     = [{ value: 'all', label: 'All Roles' }, { value: 'admin', label: 'Admins' }, { value: 'user', label: 'Users' }];
const PROVIDER_OPTIONS = [{ value: 'all', label: 'All Types' }, { value: 'credentials', label: 'Credentials' }, { value: 'google', label: 'Google' }, { value: 'guest', label: 'Guests' }];

const PROVIDER_BADGE = {
  guest:       { label: 'Guest',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  credentials: { label: 'Credentials', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  google:      { label: 'Google',      cls: 'bg-green-50 text-green-700 border-green-200' },
};
const ITEMS_PER_PAGE = 15;

const fmt     = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }) {
  const sz   = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  const ring = user.role === 'admin' ? 'border-2 border-[#800000]' : 'border border-gray-200';
  return (
    <div className={`${sz} ${ring} rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0
      ${user.role === 'admin' ? 'bg-[#800000]/10 text-[#800000]' : 'bg-gray-100 text-gray-500'}`}>
      {user.image
        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
        : (user.name?.charAt(0) || 'U').toUpperCase()}
    </div>
  );
}

// ── Block button ───────────────────────────────────────────────────────────────
function BlockBtn({ type, value, label, onBlocked }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    if (!confirm(`Block ${type}: ${value}?\nThis will prevent any orders from this ${type} for 30 days.`)) return;
    setBusy(true);
    await blockEntity({ type, value, reason: `Admin blocked ${type} from user panel`, durationHours: 720 });
    setBusy(false);
    onBlocked?.();
  };
  return (
    <button onClick={handle} disabled={busy}
      className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
      {busy ? <Loader2 size={10} className="animate-spin"/> : <WifiOff size={10}/>}
      {label}
    </button>
  );
}

// ── User detail panel (expanded) ───────────────────────────────────────────────
function UserDetailPanel({ userId, onClose, router }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getUserDetail(userId);
    setData(res);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="px-5 py-8 flex items-center justify-center border-t border-gray-100 bg-gray-50/50">
      <Loader2 size={20} className="animate-spin text-gray-400"/>
    </div>
  );
  if (!data || data.error) return (
    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">Failed to load detail.</div>
  );

  const { user, orders } = data;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-gray-100 bg-[#fafafa] overflow-hidden"
    >
      <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── IP History ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={13} className="text-gray-400"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Known IPs</span>
          </div>
          {user.registrationIp && (
            <div className="mb-2 text-[10px] text-gray-500">
              <span className="font-bold text-gray-400 uppercase tracking-wide mr-1">Registration:</span>
              <span className="font-mono">{user.registrationIp}</span>
            </div>
          )}
          {!user.knownIps?.length ? (
            <p className="text-[11px] text-gray-400 italic">No IPs recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {user.knownIps.map((entry, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-gray-800">{entry.ip}</span>
                    <BlockBtn type="ip" value={entry.ip} label="Block IP" onBlocked={() => load()}/>
                  </div>
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span>First: {fmt(entry.firstSeen)} {fmtTime(entry.firstSeen)}</span>
                    <span>Last: {fmt(entry.lastSeen)} {fmtTime(entry.lastSeen)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Device History ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Monitor size={13} className="text-gray-400"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Known Devices</span>
          </div>
          {!user.knownDevices?.length ? (
            <p className="text-[11px] text-gray-400 italic">No devices recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {user.knownDevices.map((entry, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-gray-700 truncate">{entry.deviceId}</span>
                    <BlockBtn type="device" value={entry.deviceId} label="Block Device" onBlocked={() => load()}/>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mb-1">{entry.userAgent || 'Unknown UA'}</p>
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span>First: {fmt(entry.firstSeen)}</span>
                    <span>Last: {fmt(entry.lastSeen)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Orders ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={13} className="text-gray-400"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Orders</span>
          </div>
          {!orders?.length ? (
            <p className="text-[11px] text-gray-400 italic">No orders yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {orders.map((o, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-gray-700">{o.orderId}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded
                      ${o.status === 'Delivered' ? 'bg-green-50 text-green-700' :
                        o.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-gray-400 mb-1">
                    <span>৳{Number(o.totalAmount || 0).toLocaleString('en-BD')}</span>
                    <span>{o.paymentMethod}</span>
                    <span>{fmt(o.createdAt)}</span>
                  </div>
                  {o.clientIp && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Globe size={9}/>
                      <span className="font-mono">{o.clientIp}</span>
                      {o.deviceId && <><Smartphone size={9} className="ml-1"/><span className="font-mono truncate">{o.deviceId}</span></>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Guest upgrade status */}
      {user.provider === 'guest' && (
        <div className="px-5 pb-3 pt-3 border-t border-amber-100 bg-amber-50/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Guest Account — Not Yet Upgraded</p>
          <p className="text-[11px] text-amber-600">
            This user placed orders as a guest.
            They can upgrade to a full account by using <strong>Forgot Password</strong> on their email
            {user.email?.endsWith('@oura.guest') ? ` (phone-based: ${user.email})` : ` (${user.email})`},
            or by signing in with Google using the same email.
            All their orders and data will be kept.
          </p>
        </div>
      )}

      {/* Block user account */}
      <div className="px-5 pb-4 flex items-center gap-3 border-t border-gray-100 pt-3">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Block user account:</span>
        <BlockBtn type="user" value={user._id} label="Block Account (30d)" onBlocked={() => router.refresh()}/>
        <button
          onClick={() => blockEntity({ type: 'user', value: user._id, reason: 'Admin permanent block', durationHours: null }).then(() => router.refresh())}
          className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">
          <Ban size={10}/> Permanent Ban
        </button>
      </div>
    </motion.div>
  );
}

// ── User row ───────────────────────────────────────────────────────────────────
function UserRow({ user, loading, onAction, router }) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [expanded,    setExpanded]    = useState(false);
  const isLoading = loading === user._id;

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* ── Desktop layout ── */}
      <div
        className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3.5 items-center group hover:bg-gray-50/70 transition-colors cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Identity */}
        <div className="col-span-3 flex items-center gap-3 min-w-0">
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

        {/* Network info summary */}
        <div className="col-span-3 min-w-0 space-y-0.5">
          {user.registrationIp && (
            <div className="flex items-center gap-1.5">
              <Globe size={10} className="text-gray-300 shrink-0"/>
              <span className="text-[10px] font-mono text-gray-400">{user.registrationIp}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {user.knownIps?.length > 0 && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">
                {user.knownIps.length} IP{user.knownIps.length > 1 ? 's' : ''}
              </span>
            )}
            {user.knownDevices?.length > 0 && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-500 border border-purple-100">
                {user.knownDevices.length} Device{user.knownDevices.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Role + Status + expand */}
        <div className="col-span-3 flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border
              ${user.role === 'admin' ? 'bg-[#800000] text-white border-[#800000]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {user.role}
            </span>
            {PROVIDER_BADGE[user.provider] && (
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${PROVIDER_BADGE[user.provider].cls}`}>
                {PROVIDER_BADGE[user.provider].label}
              </span>
            )}
            {user.isBanned
              ? <span className="text-[9px] font-black uppercase px-2 py-1 rounded border bg-red-50 text-red-600 border-red-200 flex items-center gap-1"><Ban size={9}/>Banned</span>
              : <span className="text-[9px] font-black uppercase px-2 py-1 rounded border bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle2 size={9}/>Active</span>
            }
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => onAction('role', user._id, user.role)} disabled={isLoading} title={user.role === 'admin' ? 'Demote' : 'Promote'}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#800000] hover:border-[#800000]/30 hover:bg-[#800000]/5 transition-all disabled:opacity-40">
              {isLoading ? <Loader2 size={12} className="animate-spin"/> : <ShieldAlert size={12}/>}
            </button>
            <button onClick={() => onAction('ban', user._id, user.isBanned)} disabled={isLoading} title={user.isBanned ? 'Unban' : 'Ban'}
              className={`p-1.5 rounded-lg border transition-all disabled:opacity-40
                ${user.isBanned ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50'}`}>
              <Ban size={12}/>
            </button>
            <button onClick={() => onAction('delete', user._id)} disabled={isLoading} title="Delete"
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40">
              <Trash2 size={12}/>
            </button>
          </div>
          <div className="text-gray-300 group-hover:text-gray-400 transition-colors">
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </div>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="sm:hidden flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors" onClick={() => setExpanded(v => !v)}>
        <Avatar user={user} size="lg"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-sm text-gray-900 truncate">{user.name || 'Unknown'}</p>
            {user.role === 'admin' && <Shield size={11} className="text-[#800000] fill-[#800000] shrink-0"/>}
            {user.isBanned && <Ban size={11} className="text-red-500 shrink-0"/>}
          </div>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
          {user.phone && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{user.phone}</p>}
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border
              ${user.role === 'admin' ? 'bg-[#800000] text-white border-[#800000]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{user.role}</span>
            {PROVIDER_BADGE[user.provider] && (
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${PROVIDER_BADGE[user.provider].cls}`}>
                {PROVIDER_BADGE[user.provider].label}
              </span>
            )}
            {user.isBanned
              ? <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200">Banned</span>
              : <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">Active</span>}
            {user.knownIps?.length > 0 && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">{user.knownIps.length} IP</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-400 shrink-0"/> : <ChevronDown size={14} className="text-gray-400 shrink-0"/>}
      </div>

      {/* ── Expanded detail panel ── */}
      <AnimatePresence>
        {expanded && <UserDetailPanel userId={user._id} onClose={() => setExpanded(false)} router={router}/>}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function UserClient({ initialUsers }) {
  const router   = useRouter();
  const [loading,  setLoading]  = useState(null);
  const [search,   setSearch]   = useState('');
  const [role,     setRole]     = useState('all');
  const [provider, setProvider] = useState('all');
  const [page,     setPage]     = useState(1);

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
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
        || u.phone?.includes(q) || u.registrationIp?.includes(q) || u.knownIps?.some(e => e.ip.includes(q)));
    }
    if (role !== 'all')     list = list.filter(u => u.role === role);
    if (provider !== 'all') list = list.filter(u => u.provider === provider);
    return list;
  }, [initialUsers, search, role, provider]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const adminCount  = initialUsers.filter(u => u.role === 'admin').length;
  const bannedCount = initialUsers.filter(u => u.isBanned).length;
  const guestCount  = initialUsers.filter(u => u.provider === 'guest').length;

  return (
    <div className="min-h-screen bg-[#faf9f6] font-manrope text-gray-900 pt-16 lg:pt-0">
      <AdminPageHeader eyebrow="Community" title="Users" count={filtered.length} countLabel="users"/>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-5">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          <AdminStatCard label="Total Users"  value={initialUsers.length} icon={UserIcon} color="bg-gray-100 text-gray-600"/>
          <AdminStatCard label="Admins"       value={adminCount}          icon={Shield}   color="bg-[#800000]/10 text-[#800000]"/>
          <AdminStatCard label="Guests"       value={guestCount}          icon={UserIcon} color="bg-amber-50 text-amber-700"/>
          <AdminStatCard label="Restricted"   value={bannedCount}         icon={Ban}      color="bg-red-50 text-red-600" highlight={bannedCount > 0}/>
        </div>

        <AdminFilterBar>
          <AdminFilterRow>
            <AdminSearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Name, Email, Phone, IP…" className="sm:col-span-2"/>
            <CustomSelect value={role}     onChange={v => { setRole(v);     setPage(1); }} options={ROLE_OPTIONS}/>
            <CustomSelect value={provider} onChange={v => { setProvider(v); setPage(1); }} options={PROVIDER_OPTIONS}/>
          </AdminFilterRow>
        </AdminFilterBar>

        <AdminCard noPad>
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-200 bg-gray-50">
            {['Identity', 'Contact', 'Network', 'Role & Status'].map((h, i) => (
              <div key={i} className={`text-[9px] font-black uppercase tracking-widest text-gray-400
                ${i === 0 ? 'col-span-3' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-3' : 'col-span-3'}`}>{h}</div>
            ))}
          </div>

          {paginated.length === 0 ? (
            <AdminEmptyState icon={UserIcon} title="No users found" subtitle="Try adjusting your search"/>
          ) : (
            <div>
              {paginated.map(u => (
                <UserRow key={u._id} user={u} loading={loading} onAction={handleAction} router={router}/>
              ))}
            </div>
          )}

          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={15}/>
              </button>
              <span className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 min-w-[80px] text-center">
                {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={15}/>
              </button>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
