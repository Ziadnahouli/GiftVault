"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, LogOut, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency, currencies } = useCurrency();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-dark-950/95 backdrop-blur-md border-b border-dark-800/80 shadow-xl">
      <div className="page-container">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text tracking-tight hidden sm:block">GiftVault</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-dark-300 hover:text-white transition-colors">{t('common.home')}</Link>
            <Link href="/shop" className="text-dark-300 hover:text-white transition-colors">{t('common.shop')}</Link>
            
            {/* Search */}
            <div className="relative group">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 group-focus-within:text-primary-400 transition-colors" />
              <input 
                type="text" 
                placeholder={t('common.search')}
                className="pl-10 pr-4 py-2 w-64 bg-dark-900 border border-dark-700 rounded-full text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Currency Selector */}
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              aria-label="Select currency"
              className="bg-dark-900 border border-dark-800 rounded-xl px-2.5 py-1.5 text-dark-200 text-xs font-semibold focus:outline-none cursor-pointer hover:text-white transition-colors"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code} className="bg-dark-900 text-white">{c.code}</option>
              ))}
            </select>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              aria-label="Toggle language"
              className="px-2.5 py-1.5 bg-dark-900 border border-dark-800 rounded-xl text-dark-200 hover:text-white text-xs font-bold transition-colors uppercase"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>

            {/* Cart Toggle */}
            <button 
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart (${itemCount} items)`}
              className="relative p-2.5 bg-dark-900 border border-dark-800 rounded-xl text-dark-300 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-glow-sm">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Menu (Desktop) */}
            <div className="hidden md:flex items-center gap-4 border-l border-dark-700 pl-5">
              {isAuthenticated ? (
                <div className="relative group">
                  <button 
                    aria-label="User account menu"
                    className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user?.name}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-dark-900 border border-dark-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                    <div className="p-2 space-y-1">
                      {isAdmin && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-white/5 rounded-lg">
                          {t('common.admin_panel')}
                        </Link>
                      )}
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-white/5 rounded-lg">
                        {t('common.dashboard')}
                      </Link>
                      <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/5 rounded-lg flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> {t('common.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-primary py-2 px-5 text-sm">
                  {t('common.login')}
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 w-full bg-dark-950 border-t border-b border-dark-800 shadow-2xl animate-fade-in-down max-w-full overflow-hidden">
          <div className="p-4 space-y-4 max-w-full">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input 
                type="text" 
                placeholder={t('common.search')}
                className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-900 rounded-xl font-medium text-sm">{t('common.home')}</Link>
              <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-900 rounded-xl font-medium text-sm">{t('common.shop')}</Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-900 rounded-xl font-medium text-sm">{t('common.dashboard')}</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-900 rounded-xl font-medium text-sm">{t('common.admin_panel')}</Link>}
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-left px-4 py-3 text-rose-400 hover:bg-dark-900 rounded-xl font-medium text-sm">{t('common.logout')}</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-primary-400 hover:bg-dark-900 rounded-xl font-semibold text-sm">{t('common.login')}</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
