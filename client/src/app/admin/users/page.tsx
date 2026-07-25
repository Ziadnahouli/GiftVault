"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Shield, ShieldAlert, User, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const loadUsers = () => {
    setIsLoading(true);
    let url = '/admin/users?limit=100';
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    fetchApi(url)
      .then(res => setUsers(res.users || []))
      .catch(err => toast.error('Failed to load users'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleUpdateRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (newRole === 'admin' && !window.confirm('Are you sure you want to grant this user ADMIN privileges?')) return;
    if (newRole === 'customer' && !window.confirm('Are you sure you want to revoke this user\'s ADMIN privileges?')) return;

    try {
      await fetchApi(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      toast.success('User role updated');
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: number) => {
    try {
      await fetchApi(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: currentStatus ? 0 : 1 })
      });
      toast.success(currentStatus ? 'User disabled' : 'User enabled');
      setUsers(users.map(u => u.id === id ? { ...u, is_active: currentStatus ? 0 : 1 } : u));
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Users</h1>
          <p className="text-dark-400">Manage customers and admin accounts.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 flex items-center gap-4 bg-dark-900/50">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900/50 text-dark-400 text-sm border-b border-dark-800">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-center">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id} className={`transition-colors ${user.is_active ? 'hover:bg-dark-800/50' : 'bg-rose-950/10 opacity-75'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-primary-400 shrink-0 border border-dark-700">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {user.name}
                            {!user.is_active && <Badge variant="default" className="bg-rose-500/20 text-rose-400 text-[10px] py-0">Banned</Badge>}
                          </div>
                          <div className="text-xs text-dark-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {user.whatsapp || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role === 'admin' ? (
                        <Badge variant="primary" className="bg-secondary-500/20 text-secondary-300 border-secondary-500/30">
                          <ShieldAlert className="w-3 h-3 mr-1 inline" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="default">Customer</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateRole(user.id, user.role)}
                          className="px-3 py-1.5 rounded-lg bg-dark-800 text-xs font-bold text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          Make {user.role === 'admin' ? 'Customer' : 'Admin'}
                        </button>
                        <button 
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            user.is_active 
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {user.is_active ? 'Ban User' : 'Unban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-dark-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
