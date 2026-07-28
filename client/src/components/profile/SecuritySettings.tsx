"use client";

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  LogOut,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';

interface SessionItem {
  id: number;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export function SecuritySettings() {
  const { user, logout, logoutAll, updateUserData, refreshUser } = useAuth();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Email Change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Phone Change & OTP Modal state
  const [newPhone, setNewPhone] = useState('');
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Notification Settings state
  const [notifications, setNotifications] = useState({
    email: user?.notificationSettings?.email ?? true,
    sms: user?.notificationSettings?.sms ?? true,
    security: user?.notificationSettings?.security ?? true,
  });
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetchApi('/auth/sessions');
      setSessions(res.sessions || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: number) => {
    try {
      await fetchApi(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
      toast.success('Session revoked');
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke session');
    }
  };

  const handleLogoutAll = async () => {
    if (confirm('Are you sure you want to log out from all devices? You will need to sign in again.')) {
      try {
        await logoutAll();
        toast.success('Logged out from all devices');
      } catch (err: any) {
        toast.error('Failed to logout from all devices');
      }
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !emailPassword) return;

    setIsChangingEmail(true);
    try {
      const res = await fetchApi('/auth/change-email', {
        method: 'POST',
        body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
      });
      toast.success(res.message);
      updateUserData(res.user);
      setNewEmail('');
      setEmailPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setIsChangingPass(true);
    try {
      const res = await fetchApi('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success(res.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleStartPhoneChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone) return;
    setIsPhoneModalOpen(true);
  };

  const handlePhoneSuccess = async (idToken?: string) => {
    try {
      const res = await fetchApi('/auth/verify-profile-phone', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: newPhone, idToken }),
      });
      toast.success('Phone number updated successfully!');
      updateUserData(res.user);
      setNewPhone('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update phone number');
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifs(true);
    try {
      const res = await fetchApi('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ notification_settings: notifications }),
      });
      toast.success('Notification preferences updated');
      updateUserData(res.user);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notification settings');
    } finally {
      setIsSavingNotifs(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Verification Summary */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" /> Account Identity & Verification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Status */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-dark-400">Email Address</div>
                <div className="text-sm font-semibold text-white">{user?.email}</div>
              </div>
            </div>
            {user?.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                Unverified
              </span>
            )}
          </div>

          {/* Phone Status */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary-500/10 text-secondary-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-dark-400">Phone Number</div>
                <div className="text-sm font-semibold text-white">
                  {user?.phoneNumber || 'Not linked'}
                </div>
              </div>
            </div>
            {user?.phoneVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Connected Devices & Active Sessions */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-primary-400" /> Connected Devices & Active Sessions
            </h3>
            <p className="text-xs text-dark-400 mt-0.5">Manage active sessions across browsers and mobile devices</p>
          </div>
          <button
            onClick={handleLogoutAll}
            className="btn-secondary py-2 px-4 text-xs font-semibold rounded-xl text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout All Devices
          </button>
        </div>

        {isLoadingSessions ? (
          <div className="text-center py-8 text-dark-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary-400" /> Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-dark-400 text-sm">No active sessions found.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-dark-700 text-dark-200">
                    {sess.deviceName.toLowerCase().includes('mobile') ? (
                      <Smartphone className="w-5 h-5 text-primary-400" />
                    ) : (
                      <Laptop className="w-5 h-5 text-secondary-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{sess.browser} on {sess.os}</span>
                      {sess.isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-dark-400 mt-0.5 flex items-center gap-3">
                      <span>IP: {sess.ipAddress}</span>
                      <span>•</span>
                      <span>Last active: {new Date(sess.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors self-end sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Email Form */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary-400" /> Change Email Address
          </h4>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="input-field text-xs py-2.5 rounded-xl bg-dark-800 border-dark-700 text-white w-full"
                placeholder="newemail@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                className="input-field text-xs py-2.5 rounded-xl bg-dark-800 border-dark-700 text-white w-full"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingEmail}
              className="btn-primary w-full py-2.5 text-xs font-semibold rounded-xl"
            >
              {isChangingEmail ? 'Updating Email...' : 'Update Email Address'}
            </button>
          </form>
        </div>

        {/* Change Phone Form */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-secondary-400" /> Change / Link Phone Number
          </h4>
          <form onSubmit={handleStartPhoneChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                New Phone Number (E.164 Format)
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className="input-field text-xs py-2.5 rounded-xl bg-dark-800 border-dark-700 text-white w-full"
                placeholder="+1234567890"
              />
            </div>
            <p className="text-[11px] text-dark-400">Updating your phone number requires 6-digit OTP verification.</p>
            <button
              type="submit"
              className="btn-secondary w-full py-2.5 text-xs font-semibold rounded-xl text-white hover:bg-dark-700"
            >
              Verify & Link Phone
            </button>
          </form>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
        <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-400" /> Security & Alert Notifications
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-700/40 cursor-pointer">
            <span className="text-xs font-medium text-dark-200">Email alerts on new login from unrecognized devices</span>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
              className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/30"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 border border-dark-700/40 cursor-pointer">
            <span className="text-xs font-medium text-dark-200">Security alerts when password or email is changed</span>
            <input
              type="checkbox"
              checked={notifications.security}
              onChange={(e) => setNotifications({ ...notifications, security: e.target.checked })}
              className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/30"
            />
          </label>
        </div>

        <button
          onClick={handleSaveNotifications}
          disabled={isSavingNotifs}
          className="btn-primary mt-4 py-2.5 px-6 text-xs font-semibold rounded-xl"
        >
          {isSavingNotifs ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        phoneNumber={newPhone}
        onSuccess={handlePhoneSuccess}
      />
    </div>
  );
}
