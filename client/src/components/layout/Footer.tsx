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

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Visa Logo Badge */}
              <div className="px-3.5 py-2 bg-white rounded-xl border border-dark-700 flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                <svg className="h-5 w-auto" viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M34.7 1.8L22.9 29.8H15.1L8.9 6.4C8.6 5.1 8 4.6 6.9 4C5.1 3 2.4 2.1 0 1.6L0.2 0.7H12.7C14.3 0.7 15.7 1.8 16 3.6L19 19.3L26.9 0.7H34.7V1.8ZM64.6 20.3C64.6 12.5 53.7 12.1 53.8 8.6C53.9 7.5 55 6.3 57.4 6C58.6 5.9 61.8 5.8 65.5 7.5L66.9 1H61C54.4 1 49.8 4.5 49.7 9.4C49.6 16.9 60.5 17.3 60.4 21.2C60.3 22.4 59 23.6 56.4 23.9C53.9 24.2 50.7 23.5 47.1 21.8L45.6 28.5C49.4 30.3 53.7 31.1 58.2 31.1C65.2 31.1 69.8 27.6 69.9 22.4L64.6 20.3ZM95.2 0.7H89.2C87.4 0.7 86 1.7 85.3 3.3L73 31.1H81.2L82.8 26.6H92.8L93.7 31.1H100L95.2 0.7ZM85.1 20.3L89.2 8.7L91.6 20.3H85.1ZM46.9 0.7L40.7 31.1H33L39.2 0.7H46.9Z" fill="#1434CB"/>
                  <path d="M12.7 0.7H0.2L0 1.6C4.8 2.8 9.5 4.9 12.7 7.7L16 3.6C15.7 1.8 14.3 0.7 12.7 0.7Z" fill="#F7B600"/>
                </svg>
              </div>

              {/* Whish Money Logo Badge */}
              <div className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl border border-rose-400/40 flex items-center justify-center shadow-glow-sm hover:scale-105 transition-all cursor-pointer">
                <span className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  WHISH MONEY
                </span>
              </div>
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
