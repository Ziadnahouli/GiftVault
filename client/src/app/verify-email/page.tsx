"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, RefreshCw, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { user, refreshUser } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address token...');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    const doVerify = async () => {
      try {
        const res = await fetchApi('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setStatus('success');
        setMessage(res.message || 'Your email address has been verified successfully!');
        toast.success('Email verified!');
        await refreshUser();
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      }
    };

    doVerify();
  }, [token, refreshUser]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await fetchApi('/auth/resend-verification', { method: 'POST' });
      toast.success('A new verification email has been sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-dark-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-dark-800 shadow-2xl text-center">
          {status === 'verifying' && (
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 text-primary-400 mb-4 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
              <p className="text-sm text-dark-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-sm text-dark-300 mb-6">{message}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-sm text-dark-400 mb-6">{message}</p>

              {user ? (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="btn-secondary w-full py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold mb-3"
                >
                  {isResending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Resend Verification Link
                </button>
              ) : null}

              <Link
                href="/login"
                className="text-xs text-primary-400 hover:text-primary-300 font-medium inline-block mt-2"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
