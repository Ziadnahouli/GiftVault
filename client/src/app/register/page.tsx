"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, User, Mail, Phone, Lock, Eye, EyeOff, Check, X, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [registerMode, setRegisterMode] = useState<'email' | 'phone'>('email');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verification state
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [authTokens, setAuthTokens] = useState<{ token: string; sessionToken: string } | null>(null);

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

    if (registerMode === 'email' && !formData.email) {
      toast.error('Please enter an Email Address');
      return;
    }
    if (registerMode === 'phone' && !formData.phoneNumber) {
      toast.error('Please enter a Phone Number');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isPasswordStrong) {
      toast.error('Please choose a stronger password matching security criteria.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: registerMode === 'email' ? formData.email : undefined,
          phoneNumber: registerMode === 'phone' ? formData.phoneNumber : (formData.phoneNumber || undefined),
          password: formData.password,
          registrationMethod: registerMode,
        }),
      });

      setAuthTokens({ token: res.token, sessionToken: res.sessionToken });
      setRegisteredUser(res.user);

      if (res.requiresVerification) {
        setVerificationType(res.verificationType || registerMode);
        if (res.verificationCode) {
          setDemoCodeHint(res.verificationCode);
        }
        setVerificationStep(true);
        toast.success(res.message || 'Account created! Please enter your verification code.');
      } else {
        login(res.token, res.user, res.sessionToken);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length < 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const targetIdentifier = registerMode === 'email' ? formData.email : formData.phoneNumber;
      const res = await fetchApi('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({
          code: verificationCode.trim(),
          identifier: targetIdentifier,
        }),
      });

      if (authTokens) {
        login(authTokens.token, res.user || registeredUser, authTokens.sessionToken);
      }

      toast.success('Account verified successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Verification code failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const targetIdentifier = registerMode === 'email' ? formData.email : formData.phoneNumber;
      const res = await fetchApi('/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({
          identifier: targetIdentifier,
          type: verificationType,
        }),
      });

      if (res.verificationCode) {
        setDemoCodeHint(res.verificationCode);
      }
      toast.success(res.message || 'Verification code resent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend code');
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
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 mb-4 shadow-glow-md">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-sm text-dark-400">Join GiftVault today and manage all your gift cards safely</p>
          </div>

          {!verificationStep ? (
            <>
              {/* Registration Method Tabs */}
              <div className="flex bg-dark-900/90 p-1 rounded-2xl border border-dark-800 mb-6">
                <button
                  type="button"
                  onClick={() => setRegisterMode('email')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    registerMode === 'email'
                      ? 'bg-primary-600 text-white shadow-glow-sm'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Registration</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterMode('phone')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    registerMode === 'phone'
                      ? 'bg-primary-600 text-white shadow-glow-sm'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Phone Number OTP</span>
                </button>
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

                {/* Email Address Mode */}
                {registerMode === 'email' && (
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
                )}

                {/* Phone Number Mode */}
                {registerMode === 'phone' && (
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">
                      Phone Number (E.164 Format) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                        className="input-field pl-11 py-2.5 text-sm rounded-xl bg-dark-900/80 border-dark-700 focus:border-primary-500 text-white placeholder-dark-500 w-full"
                        placeholder="+1234567890"
                      />
                    </div>
                    <p className="text-[11px] text-dark-400 mt-1">Include country code (e.g. +14155552671 or +96103123456)</p>
                  </div>
                )}

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
            </>
          ) : (
            /* 6-Digit Code / OTP Verification Step */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/30 text-center">
                <p className="text-xs text-primary-300 mb-1">Verification Required</p>
                <p className="text-sm text-white font-medium">
                  Enter 6-digit code sent to{' '}
                  <span className="font-bold text-primary-400">
                    {verificationType === 'email' ? formData.email : formData.phoneNumber}
                  </span>
                </p>
              </div>

              {demoCodeHint && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 text-center">
                  🔑 <span className="font-semibold">Demo Code:</span> Use code{' '}
                  <span className="font-mono text-base font-bold underline tracking-widest text-amber-200">{demoCodeHint}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 text-center">
                    6-Digit Verification Code
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="input-field pl-11 py-3 text-center text-xl font-mono tracking-widest rounded-xl bg-dark-900 border-dark-700 focus:border-primary-500 text-white w-full"
                      placeholder="123456"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length < 6}
                  className="btn-primary w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm shadow-glow-sm hover:shadow-glow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? <span>Verifying...</span> : <span>Verify & Complete Registration</span>}
                </button>
              </form>

              <div className="flex justify-between items-center text-xs text-dark-400 pt-2 border-t border-dark-800">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationStep(false)}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  Edit Information
                </button>
              </div>
            </div>
          )}

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
