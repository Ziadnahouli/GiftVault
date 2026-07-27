"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });

      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-dark-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-dark-800 shadow-2xl">
          {!isSuccess ? (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 mb-3 border border-primary-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Set New Password</h1>
                <p className="text-xs text-dark-400">
                  Enter your new password below to secure your GiftVault account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="input-field pr-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-dark-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="input-field py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password Reset Successful</h2>
              <p className="text-xs text-dark-300 mb-6">
                Your password has been updated. You can now log into your account using your new credentials.
              </p>
              <Link
                href="/login"
                className="btn-primary inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
