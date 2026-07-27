"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Search,
  ShieldAlert,
  User,
  Crown,
  CheckCircle2,
  XCircle,
  KeyRound,
  MailCheck,
  LogOut,
  Ban,
  Unlock,
  Flame,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserSessions, setSelectedUserSessions] = useState<any[] | null>(null);
  const [activeUserModal, setActiveUserModal] = useState<any | null>(null);

  const loadUsers = () => {
    setIsLoading(true);
    let url = '/admin/users?limit=100';
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    fetchApi(url)
      .then((res) => setUsers(res.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await fetchApi(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(`User account has been ${nextStatus === 'active' ? 'enabled' : 'disabled'}`);
      setUsers(users.map((u) => (u.id === id ? { ...u, accountStatus: nextStatus } : u)));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const handleForcePasswordReset = async (id: number) => {
    if (!confirm('Send a forced password reset link to this user?')) return;
    try {
      const res = await fetchApi(`/admin/users/${id}/force-password-reset`, { method: 'POST' });
      toast.success(res.message);
    } catch (error: any) {
      toast.error(error.message || 'Failed to trigger password reset');
    }
  };

  const handleForceVerifyEmail = async (id: number) => {
    try {
      const res = await fetchApi(`/admin/users/${id}/force-verify-email`, { method: 'POST' });
      toast.success(res.message);
      setUsers(users.map((u) => (u.id === id ? { ...u, emailVerified: true } : u)));
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify email');
    }
  };

  const handleViewSessions = async (targetUser: any) => {
    setActiveUserModal(targetUser);
    try {
      const res = await fetchApi(`/admin/users/${targetUser.id}/sessions`);
      setSelectedUserSessions(res.sessions || []);
    } catch (error: any) {
      toast.error('Failed to fetch user sessions');
    }
  };

  const handleLogoutAllDevices = async (id: number) => {
    if (!confirm('Revoke all active sessions for this user?')) return;
    try {
      const res = await fetchApi(`/admin/users/${id}/logout-all`, { method: 'POST' });
      toast.success(res.message);
      if (activeUserModal?.id === id) {
        setSelectedUserSessions([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke user sessions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
          <p className="text-dark-400 text-sm">
            Monitor Firebase identities, authentication status, active sessions, and security accounts.
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl border border-dark-800">
        <div className="p-4 border-b border-dark-800 flex items-center gap-4 bg-dark-900/50">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or Firebase UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-dark-900/80 text-dark-400 text-xs border-b border-dark-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">User / Firebase UID</th>
                <th className="px-6 py-4 font-semibold">Identity Details</th>
                <th className="px-6 py-4 font-semibold">Verification</th>
                <th className="px-6 py-4 font-semibold">Provider / Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/80 text-xs">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-36" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-28 ml-auto" /></td>
                    </tr>
                  ))
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      u.accountStatus === 'active' ? 'hover:bg-dark-800/40' : 'bg-rose-950/10 opacity-80'
                    }`}
                  >
                    {/* User & UID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-dark-800 flex items-center justify-center text-primary-400 shrink-0 border border-dark-700">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {u.role === 'super_admin' && (
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            {u.role === 'admin' && (
                              <ShieldAlert className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-dark-400 font-mono">
                            UID: {u.firebaseUid ? u.firebaseUid.slice(0, 14) + '...' : 'Local ID #' + u.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{u.email}</div>
                      <div className="text-dark-400 text-[11px]">{u.phoneNumber || 'No phone linked'}</div>
                    </td>

                    {/* Verification Flags */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border w-max ${
                            u.emailVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {u.emailVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Email: {u.emailVerified ? 'Verified' : 'Unverified'}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border w-max ${
                            u.phoneVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-dark-800 text-dark-400 border-dark-700'
                          }`}
                        >
                          {u.phoneVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          Phone: {u.phoneVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>

                    {/* Auth Provider */}
                    <td className="px-6 py-4">
                      <div className="text-dark-200 font-medium capitalize">{u.authProvider || 'local'}</div>
                      <div className="text-dark-400 text-[10px] capitalize">Method: {u.registrationMethod}</div>
                    </td>

                    {/* Account Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                          u.accountStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {u.accountStatus === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.accountStatus)}
                          title={u.accountStatus === 'active' ? 'Disable Account' : 'Enable Account'}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            u.accountStatus === 'active'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.accountStatus === 'active' ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleForcePasswordReset(u.id)}
                          title="Force Password Reset"
                          className="p-1.5 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {!u.emailVerified && (
                          <button
                            onClick={() => handleForceVerifyEmail(u.id)}
                            title="Force Verify Email"
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <MailCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleViewSessions(u)}
                          title="View Connected Devices / Sessions"
                          className="p-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition-colors"
                        >
                          <Laptop className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions Modal for Selected User */}
      {activeUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-dark-800">
              <div>
                <h3 className="text-base font-bold text-white">Sessions for {activeUserModal.name}</h3>
                <p className="text-xs text-dark-400">{activeUserModal.email}</p>
              </div>
              <button
                onClick={() => setActiveUserModal(null)}
                className="text-dark-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {!selectedUserSessions ? (
                <div className="text-center py-6 text-xs text-dark-400">Loading active sessions...</div>
              ) : selectedUserSessions.length === 0 ? (
                <div className="text-center py-6 text-xs text-dark-400">No active sessions for this user.</div>
              ) : (
                selectedUserSessions.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-xl bg-dark-800/60 border border-dark-700/60 text-xs">
                    <div className="font-semibold text-white">{s.browser} on {s.os}</div>
                    <div className="text-dark-400 text-[11px] mt-0.5">IP: {s.ip_address} • Last active: {new Date(s.last_active).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-dark-800 flex justify-between">
              <button
                onClick={() => handleLogoutAllDevices(activeUserModal.id)}
                className="btn-secondary text-xs py-2 px-4 text-rose-400 hover:bg-rose-500/10 border-rose-500/20 flex items-center gap-1.5 rounded-xl font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" /> Force Logout All Devices
              </button>
              <button
                onClick={() => setActiveUserModal(null)}
                className="btn-secondary text-xs py-2 px-4 rounded-xl font-semibold text-dark-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
