"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setIsSubmitted(true);
      toast.success('Password reset email dispatched.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-dark-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-dark-800 shadow-2xl">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs text-dark-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>

          {!isSubmitted ? (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 mb-3 border border-primary-500/20">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Forgot Password?</h1>
                <p className="text-xs text-dark-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Sending Link...' : 'Send Reset Link'} <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-xs text-dark-300 mb-6">
                If an account exists for <span className="text-white font-medium">{email}</span>, we have sent instructions to reset your password.
              </p>
              <Link
                href="/login"
                className="btn-secondary inline-flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold"
              >
                Return to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
