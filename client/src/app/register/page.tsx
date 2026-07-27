"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, User, Mail, Phone, Lock, Eye, EyeOff, Check, X, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password Strength Rules
  const passwordRules = [
    { label: 'At least 8 characters', valid: formData.password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(formData.password) },
    { label: 'One number', valid: /[0-9]/.test(formData.password) },
    { label: 'One special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const validCount = passwordRules.filter((r) => r.valid).length;
  const isPasswordStrong = validCount >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isPasswordStrong) {
      toast.error('Please choose a stronger password matching the security criteria.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber || undefined,
          password: formData.password,
        }),
      });

      login(res.token, res.user, res.sessionToken);
      toast.success(res.message || 'Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-dark-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 py-12 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-lg glass p-8 rounded-3xl border border-dark-800 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4 shadow-glow-md">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-sm text-dark-400">Join GiftVault today and manage all your gift cards safely</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-field pl-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-field pl-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                Phone Number (E.164 Format)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="input-field pl-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                  placeholder="+1234567890"
                />
              </div>
              <p className="text-[11px] text-dark-400 mt-1">Example: +14155552671 (include country code)</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-field pl-11 pr-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
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

              {/* Password Strength Meter */}
              {formData.password.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-dark-900/90 border border-dark-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-dark-300 mb-1">
                    <span>Password Strength:</span>
                    <span className={`font-semibold ${validCount >= 4 ? 'text-emerald-400' : validCount >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {validCount >= 4 ? 'Strong' : validCount >= 2 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-1.5 mb-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-full rounded-full transition-all ${
                          lvl <= validCount
                            ? validCount >= 4
                              ? 'bg-emerald-500'
                              : validCount >= 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-dark-700'
                        }`}
                      ></div>
                    ))}
                  </div>
                  {passwordRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      {rule.valid ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-dark-500 shrink-0" />
                      )}
                      <span className={rule.valid ? 'text-dark-200' : 'text-dark-500'}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="input-field pl-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm shadow-glow-sm hover:shadow-glow-md transition-all mt-4 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-dark-400 border-t border-dark-800/80 pt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
