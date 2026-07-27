"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Share2, MessageCircle, Mail, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-950 pt-20 pb-10 border-t border-dark-800">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text tracking-tight">GiftVault</span>
            </Link>
            <p className="text-dark-300 text-sm leading-relaxed">
              {t('footer.about')}
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Share GiftVault" className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-dark-300 hover:text-primary-400 hover:bg-dark-800 transition-colors">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" aria-label="GiftVault Community Chat" className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-800 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Email Support" className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-dark-300 hover:text-primary-400 hover:bg-dark-800 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" aria-label="GiftVault Global Site" className="w-10 h-10 rounded-full bg-dark-900 flex items-center justify-center text-dark-300 hover:text-primary-400 hover:bg-dark-800 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">{t('footer.quick_links')}</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">{t('common.home')}</Link></li>
              <li><Link href="/shop" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">{t('common.shop')}</Link></li>
              <li><Link href="/about" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-6">{t('footer.support')}</h3>
            <ul className="space-y-4">
              <li><Link href="/support#faq" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">{t('footer.faq')}</Link></li>
              <li><Link href="/support#contact" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">{t('footer.contact')}</Link></li>
              <li><Link href="/support#terms" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">{t('footer.terms')}</Link></li>
              <li><Link href="/support#privacy" className="text-dark-300 hover:text-primary-400 text-sm transition-colors">{t('footer.privacy')}</Link></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-white font-semibold mb-6">Payment Options</h3>
            <p className="text-dark-300 text-sm mb-4">
              We process secure payments via WhatsApp with multiple regional options available.
            </p>
            {/* Payment Icons Placeholder */}
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1.5 bg-dark-900 rounded border border-dark-800 text-xs text-dark-200 font-medium tracking-wide">VISA</div>
              <div className="px-3 py-1.5 bg-dark-900 rounded border border-dark-800 text-xs text-dark-200 font-medium tracking-wide">MASTERCARD</div>
              <div className="px-3 py-1.5 bg-dark-900 rounded border border-dark-800 text-xs text-dark-200 font-medium tracking-wide">CRYPTO</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-dark-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dark-300 text-sm">
            &copy; {currentYear} GiftVault. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-2 text-dark-300 text-sm">
            <span>Built for gamers by gamers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
