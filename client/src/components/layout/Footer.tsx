"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, MessageCircle, Mail, Send, HelpCircle, Lock, Zap, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-dark-950 via-dark-900 to-black text-dark-200 border-t border-dark-800/80 pt-16 pb-12 overflow-hidden">
      {/* Top glowing accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

      <div className="page-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          
          {/* Brand Column */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold gradient-text tracking-tight">GiftVault</span>
            </Link>

            <p className="text-dark-300 text-xs leading-relaxed">
              Your #1 trusted digital marketplace for instant gift cards, game keys, and subscriptions worldwide. Instant WhatsApp delivery & 24/7 dedicated customer support.
            </p>

            {/* Social & Contact Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://wa.me/9613794986"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Support"
                className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-glow-sm"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@gift-vault.me"
                aria-label="Email Support"
                className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-primary-400 hover:bg-primary-500/20 hover:border-primary-500/40 transition-all shadow-glow-sm"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram Channel"
                className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all shadow-glow-sm"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-400" />
              <span>Quick Links</span>
            </h3>
            <ul className="space-y-3 text-xs">
              <li>
                <Link href="/" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  <span>{t('common.home')}</span>
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  <span>{t('common.shop')}</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  <span>{t('common.dashboard')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support Column */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-secondary-400" />
              <span>Support & Help</span>
            </h3>
            <ul className="space-y-3 text-xs">
              <li>
                <Link href="/support#faq" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
                  <span>{t('footer.faq')}</span>
                </Link>
              </li>
              <li>
                <Link href="/support#contact" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
                  <span>{t('footer.contact')}</span>
                </Link>
              </li>
              <li>
                <Link href="/support#terms" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
                  <span>{t('footer.terms')}</span>
                </Link>
              </li>
              <li>
                <Link href="/support#privacy" className="text-dark-300 hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
                  <span>{t('footer.privacy')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security Column */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Accepted Payments</span>
            </h3>
            <p className="text-dark-300 text-xs leading-relaxed">
              Instant digital delivery via WhatsApp after safe payment verification.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1.5 bg-dark-900 border border-dark-700 text-white rounded-lg text-[11px] font-bold tracking-wider">
                VISA
              </span>
              <span className="px-3 py-1.5 bg-dark-900 border border-dark-700 text-white rounded-lg text-[11px] font-bold tracking-wider">
                MASTERCARD
              </span>
              <span className="px-3 py-1.5 bg-dark-900 border border-dark-700 text-emerald-400 rounded-lg text-[11px] font-bold tracking-wider">
                WHISH MONEY
              </span>
              <span className="px-3 py-1.5 bg-dark-900 border border-dark-700 text-amber-400 rounded-lg text-[11px] font-bold tracking-wider">
                OMT
              </span>
              <span className="px-3 py-1.5 bg-dark-900 border border-dark-700 text-cyan-400 rounded-lg text-[11px] font-bold tracking-wider">
                USDT / CRYPTO
              </span>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <Award className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>100% Authentic Digital Codes Guaranteed</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-dark-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-dark-400">
          <p>&copy; {currentYear} GiftVault. All rights reserved.</p>
          <div className="flex items-center gap-4 text-dark-400">
            <span>Built for Gamers & Digital Enthusiasts</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
