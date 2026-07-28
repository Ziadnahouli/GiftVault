"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedType, setDetectedType] = useState<'email' | 'phone'>('email');

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    if (val.includes('@')) {
      setDetectedType('email');
    } else if (/^\+?\d+$/.test(val.replace(/[\s-]/g, '')) && val.length >= 4) {
      setDetectedType('phone');
    } else {
      setDetectedType('email');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsLoading(true);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
        }),
      });

      login(res.token, res.user, res.sessionToken);
      toast.success(t('common.success') || 'Logged in successfully');
      router.push(res.user.role === 'admin' || res.user.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-dark-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-12 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-secondary-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md glass p-8 rounded-3xl border border-dark-800 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4 shadow-glow-md">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-sm text-dark-400">Sign in with your Email Address or Phone Number</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Unified Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Email or Phone Number
                </label>
                <span className="text-[11px] font-medium text-primary-400 flex items-center gap-1 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                  {detectedType === 'email' ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                  {detectedType === 'email' ? 'Email Detected' : 'Phone Detected'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  {detectedType === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  required
                  className="input-field pl-11 py-3 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                  placeholder="name@example.com or +9613794986"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-11 pr-11 py-3 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500/30"
                />
                <span className="text-xs text-dark-300 font-medium">Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm shadow-glow-sm hover:shadow-glow-md transition-all mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-dark-400 border-t border-dark-800/80 pt-6">
            Don't have an account yet?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Create an Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
